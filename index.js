import {
  addCondition,
  delayToProcess,
  findLowestCommonAncestorNode, findLowestCommonAncestorNodeByList,
  isEnterEvent,
  isEscapeEvent,
  isObj,
  isStr,
  isTabBackward,
  isTabForward
} from "./utils";

/** 入口相关的焦点活动 */
const entryFocusActivity = ["KEY_ENTRY", "SWITCH_ENTRY", "CLICK_ENTRY", "INVOKE_ENTRY"];
/** 出口相关的焦点活动 */
const exitFocusActivity = ["ESC_EXIT", "KEY_EXIT", "CLICK_EXIT", "INVOKE_EXIT", "LAYER_EXIT"];
/** 列表相关的焦点活动 */
const listFocusActivity = ["FOCUS_PROTECT", "FOCUS_CORRECT", "NAV_FORWARD", "NAV_BACKWARD", "AIRBORNE_MOUSE", "UPDATE_LIST"];

/** 焦点天空 */
function focuz(config) {

  const {
    root,
    sequenceLists,
    tabPortal, shiftTabPortal,
    entriesFocusInfo, exitsFocusInfo, listsFocusInfo,
    listWrapInfo,
    firstEntry,
    updateHotConfig,
    delayWrapList,
  } = resolveFocusConfig(config);

  const rootEle = document.querySelector(root);

  /** 是否触发了开关的 mousedown，如果是，则代表当前触发的是开关，需要忽略跳过列表的 blur 事件 */
  let triggeredToggleByMouse = false;
  /** 当前聚焦的列表 */
  let currentList = null;
  /** 最后一次活动名称 */
  let lastActivity = null;
  /** mousedown 更新 currentList 之前的 currentList */
  let prevActiveListByMousedown = null;
  /** 内部触发了 outlist 出口 */
  let triggeredOutlistExitInInner = false;
  /** 内部未触发任何出口 */
  let triggeredNoExitInInner = false;
  /** 区分前一次聚焦列表为 null 的情况，有可能是第一次，也有可能是内部获得的 null */
  let prevNullBeforeFocusin = false;
  /** 是否正在延迟执行 */
  let delaying = false;

  /** 延迟执行后执行钩子 */
  const delayToProcessWithAfter = delayToProcess(() => delaying = false);
  /** 根据条件延迟执行 */
  const delayToProcessWithCondition = addCondition(() => {
    if (!delaying) return delaying = true;
    return false;
  }, delayToProcessWithAfter);

  rootEle.addEventListener("keydown", function(e) {

    const target = e.target;
    const selector = '#' + target.id;

    if (isEscapeEvent(e)) {
      if (currentList != null) {
        const listInfo = listsFocusInfo.get(currentList);
        if (listInfo.disableAuto) return;
        if (listInfo.escExit) {
          const { parentList, entry, exitDelay } = listInfo;
          delayToProcessWithCondition(exitDelay, () => {
            lastActivity = "ESC_EXIT";
            exitToTarget(parentList, entry, listInfo);
          });
          return;
        }
      }
    }

    const entryFocusInfo = entriesFocusInfo.get(selector);
    const isEntry = entryFocusInfo != null;
    // 当前在入口
    if (isEntry) {
      // 按下 Enter
      if (entryFocusInfo.key(e)) {
        // 禁止事件入口
        if (entryFocusInfo.disableAuto) return;
        const { delay, toggleEntry, target } = entryFocusInfo;
        const listFocusInfo = listsFocusInfo.get(target);
        const { entered } = listFocusInfo;
        delayToProcessWithCondition(delay, () => {
          if (toggleEntry && entered) {
            lastActivity = "SWITCH_ENTRY";
            listFocusInfo.entered = false;
            updateCurrentList(entryFocusInfo.parentList);
          } else {
            lastActivity = "KEY_ENTRY";
            focusByEntry(selector, e);
            listFocusInfo.entered = true;
          }
        });

        return;
      }
    }

    let exitFocusInfo = null;
    const isExit = !isEntry && (() => {
      exitFocusInfo = exitsFocusInfo.get(selector);
      return exitFocusInfo != null;
    })();
    // 当前在出口
    if (isExit) {
      // 按下 Enter
      if (exitFocusInfo.key(e)) {
        // 禁止事件出口
        if (exitFocusInfo.disableAuto) return;
        delayToProcessWithCondition(exitFocusInfo.delay, () => {
          lastActivity = "KEY_EXIT";
          focusByExit(selector, e, exitFocusInfo.list);
        });

        return;
      }
    }

    /** 当前的焦点处于列表的 wrap  */
    let focusedListWrap = !!listWrapInfo.get(selector);
    // 焦点保护
    if (focusedListWrap) {
      if (isTabBackward(e)) {
        const curListInfo = listsFocusInfo.get(currentList);
        const nextFocusIdx = getNextIdxByLastFocusIdxAndInitFocusIdx(curListInfo.lastFocusIdx, curListInfo.initFocusIdx, currentList.length);
        const nextFocus = curListInfo.range ? currentList.at(-1) : currentList[nextFocusIdx];
        const nextFocusEle = document.querySelector(nextFocus);
        lastActivity = "FOCUS_PROTECT";
        nextFocusEle.focus();
        e.preventDefault(); // 阻止默认行为
        return ;
      }
    }

    const curListInfo = listsFocusInfo.get(currentList);
    /** 当前是否范围模式列表 */
    const isRangeList = curListInfo && curListInfo.range;
    /** 是否是序列列表 */
    const isSequenceList = !isRangeList && currentList;
    /** 是否是列表的元素 */
    const isSequenceListItem = isSequenceList && currentList.includes(selector);
    // 当前在列表（列表为序列模式）
    if (isSequenceList) {
      const itemsLen = currentList.length;
      const lastFocusIdx = getNextIdxByLastFocusIdxAndInitFocusIdx(curListInfo.lastFocusIdx, curListInfo.initFocusIdx, itemsLen);
      if (curListInfo.forwardKey(e)) {
        lastActivity = "NAV_FORWARD";
        /** 下一个聚焦元素的 id */
        const nextFocusIdx = (lastFocusIdx + (isSequenceListItem ? 1 : 0)) % itemsLen;
        focusNext(nextFocusIdx);
      }
      else if (curListInfo.backwardKey(e)) {
        lastActivity = "NAV_BACKWARD";
        const nextFocusIdx = (lastFocusIdx - 1 + itemsLen) % itemsLen;
        focusNext(nextFocusIdx);
      }

      /** 聚焦下一个元素 */
      function focusNext(nextFocusIdx) {
        curListInfo.lastFocusIdx = nextFocusIdx; // 更新 lastFocusIdx
        const nextFocusedEle = document.querySelector(currentList[nextFocusIdx]);
        nextFocusedEle.focus(); // 聚焦
        e.preventDefault(); // 阻止默认行为
      }
    }
    // 当前在范围模式的列表
    else if (isRangeList) {
      if (isTabForward(e)) {
        lastActivity = "NAV_FORWARD";
        const rangeTailTarget = tabPortal.get(selector);
        if (rangeTailTarget != null) {
          document.querySelector(rangeTailTarget).focus(); // 聚焦
          e.preventDefault(); // 阻止默认行为
        }
      }
      if (isTabBackward(e)) {
        lastActivity = "NAV_BACKWARD";
        const rangeHeadTarget = shiftTabPortal.get(selector);
        if (rangeHeadTarget != null) {
          document.querySelector(rangeHeadTarget).focus(); // 聚焦
          e.preventDefault(); // 阻止默认行为
        }
      }
    }
  });

  rootEle.addEventListener("click", function(e) {

    const target = e.target;
    const selector = '#' + target.id;
    const entryFocusInfo = entriesFocusInfo.get(selector);
    const isEntry = entryFocusInfo != null;
    if (isEntry) {
      const { delay, toggleEntry, target } = entryFocusInfo;
      const listFocusInfo = listsFocusInfo.get(target);
      const { entered } = listFocusInfo;
      // 禁止事件入口
      if (entryFocusInfo.disableAuto) return;
      delayToProcessWithCondition(delay, () => {
        if (toggleEntry && entered) {
          lastActivity = "SWITCH_ENTRY";
          listFocusInfo.entered = false;
          updateCurrentList(entryFocusInfo.parentList);
        } else {
          if (lastActivity === "KEY_ENTRY") return; // 若是已通过 keydown 入口进入，则无需再从这里的 click 入口进入，打断
          lastActivity = "CLICK_ENTRY";
          focusByEntry(selector, e);
          listFocusInfo.entered = true;
        }
      });
    }
    let exitFocusInfo = null;
    const isExit = !isEntry && (() => {
      exitFocusInfo = exitsFocusInfo.get(selector);
      return exitFocusInfo != null;
    })();
    if (isExit) {
      const { delay, disableAuto, list } = exitFocusInfo;
      // 禁止事件出口
      if (disableAuto) return;
      delayToProcessWithCondition(delay, () => {
        lastActivity = "CLICK_EXIT";
        focusByExit(selector, e, list);
      });
    }
  });

  rootEle.addEventListener("focusin", function(e) {
    prevNullBeforeFocusin = false; // 置空，用于首次进入内部的时候，首次进入不会经过 focusout
    // 没有意图的聚焦，则进行矫正；诸如触发入口、出口、列表导航的聚焦，都是有意图的。
    if (entryFocusActivity.concat(exitFocusActivity).concat(listFocusActivity).includes(lastActivity)) {
      lastActivity = null;
      return ;
    }
    const target = e.target;
    const selector = '#' + target.id;
    /** 包含当前元素的列表 */
    const listHadItem = sequenceLists.find(li => li.includes(selector));
    const curListInfo = listsFocusInfo.get(listHadItem);
    if (curListInfo) {
      const nextFocusIdx = getNextIdxByLastFocusIdxAndInitFocusIdx(curListInfo.lastFocusIdx, curListInfo.initFocusIdx, listHadItem.length);
      lastActivity = "FOCUS_CORRECT";
      document.querySelector(listHadItem[nextFocusIdx]).focus();
      updateCurrentList(listHadItem);
      e.preventDefault();
    }
  });

  rootEle.addEventListener("focusout", function() {
    // 标签页处于非激活状态而失焦，则不做处理
    if (!document.hasFocus()) return ;
    // 用于保护可切换的入口（开关，同时作为出口的入口）能够被触发；也可用 relatedTarget 判断，但 relatedTarget 不兼容 Safari（23.09.08）
    if (triggeredToggleByMouse)
      return triggeredToggleByMouse = false;

    if (lastActivity !== "AIRBORNE_MOUSE" && // 可能会在非 rootEle 处触发 AIRBORNE_MOUSE，因此需要单独利用 setTimeout 事件循环
      entryFocusActivity.concat(exitFocusActivity).concat(listFocusActivity).includes(lastActivity)) {
      return ; // 即将进入 focusin，因此不清空 lastActivity
    }

    if (triggeredOutlistExitInInner) { // 内部触发 outlist
      triggeredOutlistExitInInner = false;
      exitByListOutlistExit(prevActiveListByMousedown);
    }
    else if (triggeredNoExitInInner || // 从一个没有 outlist 出口的列表点击内部任何其它地方
      prevNullBeforeFocusin)
      triggeredNoExitInInner = false;
    else
      exitByListOutlistExit(currentList, true); // 野外触发 outlist

    prevActiveListByMousedown = null;

    /** 通过 outlistExit 退出 */
    function exitByListOutlistExit(list, isWild) {
      /** 失焦元素是否是列表的元素 */
      const listInfo = listsFocusInfo.get(list);
      if (listInfo == null) return;
      if (listInfo.disableAuto) return ;
      // 失焦元素是列表元素，并且有 outlist 退出类型
      if (listInfo.outlistExit) {

        const { parentList, entry, exitDelay } = listInfo;
        delayToProcessWithCondition(exitDelay, () => {
          lastActivity = "LAYER_EXIT";
          exitToTarget(parentList, entry, listInfo);
        });
      } else if (isWild) updateCurrentList(null); // 若是列表禁止 outlist 退出类型，点击野区后，仍需置空 currentList
    }
  });

  rootEle.addEventListener("mousedown", function(e) {

    const targetId = e.target.id;
    const selector = '#' + targetId;
    // 重复 mousedown 在同一元素上，则忽略重复的
    if (targetId !== '' && targetId === document.activeElement.id) return ;
    // 1. 首先通过 wrap 确定列表，此时最期望用户点击非列表元素的空白区域
    let wrappedList = listWrapInfo.get(selector);
    /** 是否是序列模式的列表 */
    let isSequenceList = false;
    if (wrappedList == null) { // 点到了列表元素，或是范围模式的区域
      let curElement = e.target;
      while(curElement = curElement.parentElement) {
        const parentSelector = '#' + (curElement || {}).id;
        wrappedList = listWrapInfo.get(parentSelector);
        if (wrappedList != null) {
          isSequenceList = !listsFocusInfo.get(wrappedList).range;
          focusedListItem(); // 由于范围模式不支持焦点矫正，因此这里包容由范围模式触发的情况
          break;
        }
      }
    }

    // 2. 若无 wrap，则通过列表元素确定列表，这种情况则不再能够判断范围模式的列表
    if (wrappedList == null) {
      /** 包含当前元素的列表 */
      const listHadItem = sequenceLists.find(li => li.includes(selector));
      /** 是否是列表的元素 */
      isSequenceList = listHadItem != null;
      if (isSequenceList) { // 序列模式，范围模式不确定，因此不考虑
        wrappedList = listHadItem;
        focusedListItem();
      }
    }

    prevActiveListByMousedown = currentList;
    updateCurrentList(wrappedList);

    triggeredOutlistExitInInner = isOutlistExit();
    triggeredNoExitInInner = (!triggeredOutlistExitInInner && prevActiveListByMousedown != null);
    prevNullBeforeFocusin = prevActiveListByMousedown == null;

    // 若是序列模式，则要更新序列最后被聚焦的元素
    if (isSequenceList) {
      if (prevActiveListByMousedown == null || !triggeredOutlistExitInInner)
        updateListLastFocusIdx(selector, wrappedList);
    }

    /** 是否是开关入口 */
    const isToggle = (entriesFocusInfo.get(selector) || {}).toggleEntry;
    triggeredToggleByMouse = isToggle;

    /** 具体点击到了列表内的某个元素 */
    function focusedListItem() {
      lastActivity = "AIRBORNE_MOUSE"; // 🪂🦈
    }

    /** 上一个列表是否是 outlist 类型的出口 */
    function isOutlistExit() {
      if (prevActiveListByMousedown != null && prevActiveListByMousedown !== wrappedList) {
        const prevActiveListInfo = listsFocusInfo.get(prevActiveListByMousedown);
        return !!prevActiveListInfo.outlistExit;
      }
      return false;
    }
  });


  return {
    /** 调用式入口 */
    entry() {
      if (currentList == null) {
        const activeElement = document.activeElement;
        const selector = activeElement?.id ? `#${activeElement.id}` : null;
        if (selector === firstEntry) {
          lastActivity = "INVOKE_ENTRY";
          focusByEntry(firstEntry, { preventDefault() {} });
        }
        else
          document.querySelector(firstEntry).focus();
      } else {
        const listInfo = listsFocusInfo.get(currentList);
        const lastChildEntry = listInfo.lastChildEntry;
        if (lastChildEntry != null) {
          lastActivity = "INVOKE_ENTRY";
          focusByEntry(lastChildEntry, { preventDefault() {} });
        }
      }
    },
    /** 调用式出口 */
    exit(e) {
      if (currentList != null) {
        e?.stopPropagation?.();
        const listInfo = listsFocusInfo.get(currentList);
        const parentList = listInfo.parentList;
        if (parentList == null) {
          lastActivity = "INVOKE_EXIT";
          document.querySelector(firstEntry).focus();
          updateCurrentList(null);
        } else {
          const parentListInfo = listsFocusInfo.get(parentList);
          const nextIdx = getNextIdxByLastFocusIdxAndInitFocusIdx(parentListInfo?.lastFocusIdx, parentListInfo?.initFocusIdx, parentList.length);
          lastActivity = "INVOKE_EXIT";
          document.querySelector(parentList[nextIdx]).focus();
          updateListWrap(delayWrapList, listWrapInfo, listsFocusInfo);
          updateCurrentList(parentList);
        }
      }
    },
    /** 更新列表 */
    update(id, config) {
      let newCurrentListWrap = null;
      updateHotConfig(id, config, updateCurrentList);
      if (newCurrentListWrap) {
        lastActivity = "UPDATE_LIST";
        document.querySelector(newCurrentListWrap).focus(); // 聚焦回当前列表的包包，使下次键盘导航能聚焦至上一次的焦点位置
      }

      /** 更新后列表可能变多或变少，将 currentList 的引用更新为更新后的值，并获取更新前的 lastFocusIdx 和 entered */
      function updateCurrentList(hotListsFocusInfo, hotListWrapInfo) {
        const activeListFocusInfo = hotListsFocusInfo.get(currentList);
        // 当前列表不是动态列表
        if (activeListFocusInfo == null) return () => {};

        return function(v, nextWrap) { // 该函数闭包外层的变量，该函数将在遍历新配置的时候执行
          const {
            wrap: activeListWrap, // 当前列表的包包
            lastFocusIdx: lastFocusIdxCurList,
            entered: enteredCurList,
          } = activeListFocusInfo;
          // 更新当前列表
          if (activeListWrap === nextWrap) {
            newCurrentListWrap = nextWrap;
            currentList = v;
            return {
              lastFocusIdx: lastFocusIdxCurList, // 返回最后一次聚焦的 id，列表更新后继承该值
              entered: enteredCurList,
            };
          }
          // 更新其它列表
          const listFocusInfo = hotListsFocusInfo.get(hotListWrapInfo.get(nextWrap));
          const {
            lastFocusIdx,
            entered,
          } = listFocusInfo;
          return {
            lastFocusIdx, // 返回最后一次聚焦的 id，列表更新后继承该值
            entered,
          }
        };
      }
    },
  };

  /** 更新最后一次聚焦的列表元素 */
  function updateListLastFocusIdx(selector, list) {
    /** 包含当前元素的列表 */
    const listHadItem = list || (sequenceLists.find(li => li.includes(selector)));
    /** 是否是列表的元素 */
    const isSequenceListItem = listHadItem != null;
    if (isSequenceListItem && listHadItem.includes(selector)) {
      const curListInfo = listsFocusInfo.get(listHadItem);
      curListInfo.lastFocusIdx = listHadItem.findIndex(li => li === selector);
    }
  }

  /** 通过入口进入列表 */
  function focusByEntry(selector, e) {
    e.preventDefault();
    const { target: entryList } = entriesFocusInfo.get(selector);
    updateCurrentList(entryList);
    const curListInfo = listsFocusInfo.get(entryList);
    const nextIdx = getNextIdxByLastFocusIdxAndInitFocusIdx(curListInfo?.lastFocusIdx, curListInfo?.initFocusIdx, entryList.length);
    document.querySelector(entryList[nextIdx]).focus();
    updateListWrap(delayWrapList, listWrapInfo, listsFocusInfo);
  }

  /** 通过出口返回至入口 */
  function focusByExit(selector, e, list) {
    e.preventDefault();
    const { parentList, target } = exitsFocusInfo.get(selector);
    const listFocusInfo = listsFocusInfo.get(list);
    exitToTarget(parentList, target, listFocusInfo);
  }

  /** 更新当前聚焦的列表 */
  function updateCurrentList(list) {
    currentList = list;
  }

  /** 退出，聚焦，更新状态 */
  function exitToTarget(parentList, entry, listFocusInfo) {
    const isRoot = parentList == null;
    const exitTarget = isRoot ? entry : (() => {
      const parentListInfo = listsFocusInfo.get(parentList);
      const { lastFocusIdx } = parentListInfo;
      const exitTarget = lastFocusIdx < 0 ? entry : parentList[lastFocusIdx];
      return exitTarget;
    })();
    document.querySelector(exitTarget).focus();
    updateCurrentList(parentList); // 即将落入的列表是当前列表的父列表
    listFocusInfo.entered = false;
    updateListWrap(delayWrapList, listWrapInfo, listsFocusInfo);
  }

  /** 更新配置数据中列表的 wrap */
  function updateListWrap(delayWrapList, listWrapInfo, listsFocusInfo) {
    const removeIdx = [];
    delayWrapList.forEach((list, i) => {
      const wrap = findLowestCommonAncestorNodeByList(list);
      if (wrap != null) {
        removeIdx.push(i);
        listsFocusInfo.get(list).wrap = wrap;
        listWrapInfo.set(wrap, list);
      }
    });
    removeIdx.forEach(i => delayWrapList.splice(i, 1));
  }
}

/** 通过最后一次聚焦的列表元素 id 和初始 id，获得下一次的列表聚焦元素 id */
function getNextIdxByLastFocusIdxAndInitFocusIdx(lastFocusIdx, initFocusIdx, listLength) {
  // 尚未进入过列表
  if (lastFocusIdx == null || lastFocusIdx < 0) {
    // 设置了初始聚焦 id
    if (initFocusIdx > -1 && initFocusIdx < listLength)
      return initFocusIdx;
    return 0;
  } else return lastFocusIdx;
}

/** 分解焦点配置 */
function resolveFocusConfig(config) {

  // 根元素
  const { root } = config;
  // 一些数据，用于聚焦，例如触发入口、出口后如何聚焦
  const data = generateFocusData(config);
  return {
    root,
    ...data,
  };
}

/** 遍历配置，生成焦点相关的基础数据 */
function generateFocusData(obj) {

  // 焦点数据分为静态和动态两种，变量前缀分别为 cold 和 hot，动态数据将用于更新列表
  const [
    coldTabPortal, coldShiftTabPortal, coldEntriesFocusInfo,
    coldExitsFocusInfo, coldListsFocusInfo, coldListWrapInfo
  ] = new Array(6).fill().map(() => new Map());
  let [
    hotTabPortal, hotShiftTabPortal, hotEntriesFocusInfo,
    hotExitsFocusInfo, hotListsFocusInfo, hotListWrapInfo
  ] = new Array(6).fill().map(() => new Map());
  /** 需要延迟计算 wrap 的列表，这些列表虽然已在配置中，但实际浏览器中还未展示 */
  const delayWrapList = [];
  const coldSequenceLists = [];
  let hotSequenceLists = [];
  let firstEntry = null;
  const hotConfigInfo = new Map();

  travelConfig(obj, onConfigObject());

  // 合并静态与动态数据
  const sequenceLists = coldSequenceLists.concat(hotSequenceLists);
  const tabPortal = new Map([...coldTabPortal, ...hotTabPortal]);
  const shiftTabPortal = new Map([...coldShiftTabPortal, ...hotShiftTabPortal]);
  const entriesFocusInfo = new Map([...coldEntriesFocusInfo, ...hotEntriesFocusInfo]);
  const exitsFocusInfo = new Map([...coldExitsFocusInfo, ...hotExitsFocusInfo]);
  const listsFocusInfo = new Map([...coldListsFocusInfo, ...hotListsFocusInfo]);
  const listWrapInfo = new Map([...coldListWrapInfo, ...hotListWrapInfo]);

  return {
    /** 序列模式的列表 */
    sequenceLists,
    /** 用于范围模式的列表循环（tab） */
    tabPortal,
    /** 用于范围模式的列表循环（shift-tab） */
    shiftTabPortal,
    /** 和入口有关的信息 */
    entriesFocusInfo,
    /** 和出口有关的信息 */
    exitsFocusInfo,
    /** 和列表有关的信息，包括范围和序列模式的列表 */
    listsFocusInfo,
    /** 列表包裹物 */
    listWrapInfo,
    /** 首个入口 */
    firstEntry,
    /** 更新配置 */
    updateHotConfig,
    /** 需要延迟获取包裹的列表 */
    delayWrapList,
  };

  /** 遍历到配置的对象时执行 */
  function onConfigObject(updateHotCurrentList) { // 该层函数用于输入用于更新列表的函数，与外层形成闭包，携带外层变量
    return function(obj, pureList, parentList, lastChildEntry, isHotConfig) {
      const { entry, exit, list, id } = obj;
      const entries = arraify(entry).reduce(aryNodesReducer, []);
      const firstEntryNode = entries[0].node;
      const exits = arraify(exit).reduce(aryNodesReducer, []);
      const { wrap: listWrapByConfig, initActive, range, next, prev } = isObj(list) ? list : {};
      const listWrap = (() => {
        if (listWrapByConfig == null)
          return findLowestCommonAncestorNodeByList(pureList);
        return listWrapByConfig;
      })();
      // 若是不能找到包裹，则先推入队列，后续触发入口或出口时再寻找
      if (listWrap == null) delayWrapList.push(pureList);
      let lastFocusIdxFromHotList = -1;
      let enteredList = false;
      if (updateHotCurrentList && listWrap != null) {
        const updateProps = updateHotCurrentList(pureList, listWrap);
        if (updateProps != null) {
          lastFocusIdxFromHotList = updateProps.lastFocusIdx;
          enteredList = updateProps.entered;
        }
      }
      /** 是否是范围模式，若是设置了自定义导航键，则退出范围模式 */
      const isRangeMode = range === true && next == null && prev == null;
      if (isRangeMode) { // 是否范围模式
        const head = pureList[0];
        const tail = pureList.at(-1);
        (isHotConfig ? hotTabPortal : coldTabPortal).set(tail, head);
        (isHotConfig ? hotShiftTabPortal : coldShiftTabPortal).set(head, tail);
      } else
        (isHotConfig ? hotSequenceLists : coldSequenceLists).push(pureList);
      if (firstEntry == null) firstEntry = firstEntryNode;
      const entriesFocusInfo = isHotConfig ? hotEntriesFocusInfo : coldEntriesFocusInfo;
      /** 记录作用在所有入口上的属性 */
      let entryGlobal = {};
      for(const entry of entries ) {
        const { node, delay, toggle, manual, key } = entry;
        if (node == null) {
          entryGlobal = { delay, toggle, manual, key };
          break;
        }
      }
      entries.forEach(({ node, delay, toggle, manual, key }) => {
        if (node == null) return ;
        const { delay: gd, toggle: dt, manual: gm, key: gk } = entryGlobal
        entriesFocusInfo.set(node, {
          delay: delay == null ? gd : delay,
          toggleEntry: toggle == null ? dt : toggle, // 该入口是否同时支持退出？
          parentList,
          disableAuto: manual == null ? gm : manual, // 是否关闭由事件触发的入口
          target: pureList, // 入口目标
          key: key || gk || isEnterEvent, // 从入口进入列表的按键
        });
      });
      /** 记录作用在所有出口上的属性 */
      let exitGlobal = {};
      for(const exit of exits ) {
        const { node, delay, manual, key } = exit;
        if (node == null) {
          exitGlobal = { delay, manual, key };
          break;
        }
      }
      const exitsFocusInfo = isHotConfig ? hotExitsFocusInfo : coldExitsFocusInfo;
      let outlistExit = false;
      let escapeExit = false;
      exits.forEach(({ node, delay, manual, outlist, esc, key }) => {
        if (outlist != null) outlistExit = outlist;
        if (esc != null) escapeExit = esc;
        if (node == null) return ;
        const { delay: gd, manual: gm, key: gk } = exitGlobal;
        exitsFocusInfo.set(node, {
          delay: delay == null ? gd : delay,
          parentList,
          list: pureList,
          disableAuto: manual == null ? gm : manual, // 是否关闭由事件触发的出口
          target: firstEntryNode, // 出口目标
          key: key || gk || isEnterEvent, // 从出口回到入口的按键
        });
      });
      (isHotConfig ? hotListsFocusInfo : coldListsFocusInfo).set(pureList, {
        initFocusIdx: initActive, // 首次聚焦元素 id
        lastFocusIdx: Math.max(-1, lastFocusIdxFromHotList || -1), // 最后一次聚焦的 id
        outlistExit, // 蒙层出口
        escExit: escapeExit, // 是否存在 esc 出口
        parentList,
        entry: firstEntryNode, // 进入该列表的入口
        lastChildEntry, // 该列表中进入最后一个子列表的入口
        wrap: listWrap,
        range: isRangeMode,
        disableAuto: exitGlobal.manual, // 是否关闭由事件触发的出口
        entered: enteredList, // 是否进入
        exitDelay: exitGlobal.delay,
        forwardKey: next || isTabForward,
        backwardKey: prev || isTabBackward,
      });
      if (listWrap != null)
        (isHotConfig ? hotListWrapInfo : coldListWrapInfo).set(listWrap, pureList);
      if (isHotConfig) {
        hotConfigInfo.set(id, {
          parentList,
        });
      }
    }

    /** 分解合成字符串 node 数组 */
    function aryNodesReducer(acc, cur) {
      if (isStr(cur)) {
        return acc.concat({ node: cur });
      }
      if (Array.isArray(cur.node)) {
        cur.node.forEach(node => {
          acc = acc.concat({
            ...cur,
            node,
          });
        });
        return acc;
      }
      return acc.concat(cur);
    }

    /** 数组化入参 */
    function arraify(v) {
      return (isStr(v) ? [v] : Array.isArray(v) ? v : [v]);
    }
  }

  /** 更新指定 id 的配置 */
  function updateHotConfig(id, config, updateCurrentList) {
    const updateCurrentListByWrap = updateCurrentList(hotListsFocusInfo, hotListWrapInfo); // 这里传入的入参为引用，因此后方的值设为 new Map() 将不影响函数内取得原引用
    // 动态热数据置空
    hotTabPortal = new Map(); hotShiftTabPortal = new Map(); hotEntriesFocusInfo = new Map();
    hotExitsFocusInfo = new Map(); hotListsFocusInfo = new Map(); hotListWrapInfo = new Map();
    hotSequenceLists = [];
    const { parentList } = hotConfigInfo.get(id);
    travelConfig(config, onConfigObject(updateCurrentListByWrap), parentList, true);

    // [原合并数据, 新合并数据]
    const newSequenceLists = coldSequenceLists.concat(hotSequenceLists);
    const newTabPortal = [tabPortal, new Map([...coldTabPortal, ...hotTabPortal])];
    const newShiftTabPortal = [shiftTabPortal, new Map([...coldShiftTabPortal, ...hotShiftTabPortal])];
    const newEntriesFocusInfo = [entriesFocusInfo, new Map([...coldEntriesFocusInfo, ...hotEntriesFocusInfo])];
    const newExitsFocusInfo = [exitsFocusInfo, new Map([...coldExitsFocusInfo, ...hotExitsFocusInfo])];
    const newListsFocusInfo = [listsFocusInfo, new Map([...coldListsFocusInfo, ...hotListsFocusInfo])];
    const newListWrapInfo = [listWrapInfo, new Map([...coldListWrapInfo, ...hotListWrapInfo])];
    // 使用新合并数据替换原合并数据
    sequenceLists.splice(0, sequenceLists.length);
    sequenceLists.push(...newSequenceLists);
    [newTabPortal, newShiftTabPortal, newEntriesFocusInfo, newExitsFocusInfo, newListsFocusInfo, newListWrapInfo].forEach(([originMap, newMap]) => {
      originMap.clear();
      newMap.forEach((val, key) => originMap.set(key, val));
    });
  }
}

/** 遍历配置 */
function travelConfig(obj, onConfigObject, parentList, isHotConfig) {
  const { sub, list, id } = obj;
  const pureList = isObj(list) ? list.nodes : list;
  /** 是否叶子节点，不再有子元素 */
  const isLeave = sub == null;
  const subAry = isLeave ? [] : [].concat(sub);
  const lastChildEntry = isLeave ? null : getEntry(subAry.at(-1).entry);
  const hotConfig = isHotConfig || (id != null);
  onConfigObject(obj, pureList, parentList, lastChildEntry, hotConfig);

  subAry.forEach(subItem =>
    travelConfig(subItem, onConfigObject, pureList, isHotConfig));

  /** 获取一个入口 */
  function getEntry(entry) {
    const gotEntry = getStrOrObjEntry(entry);
    if (gotEntry != null) return gotEntry;
    if (Array.isArray(entry)) {
      const gotEntry = getStrOrObjEntry(entry[0]);
      if (gotEntry != null) return gotEntry;
    }

    function getStrOrObjEntry(entry) {
      if (isStr(entry)) return entry;
      if (isObj(entry)) {
        const entryNode = [].concat(entry.node);
        return entryNode[0];
      }
    }

  }
}

export default focuz;