import { delayToProcess, getActiveElement, isEnterEvent, isEscapeEvent, isObj, isTabBackward, isTabForward } from "./utils";

/** 焦点天空 */
function focusky(config) {

  const {
    entriesMap, exitsMap,
    root,
    sequenceLists,
    tabPortal, shiftTabPortal,
    entriesFocusInfo, exitsFocusInfo, listsFocusInfo,
    listWrapInfo,
  } = resolveFocusConfig(config);

  const rootEle = document.querySelector(root);

  /** 当前聚焦的列表元素是通过键盘导航聚焦的 */
  let focusedListItemByNavList = false;
  /** 当前聚焦的列表元素是通过点击聚焦的 */
  let focusedListItemByMouse = false;
  /** 是否触发了开关的 mousedown，如果是，则代表当前触发的是开关，需要忽略跳过列表的 blur 事件 */
  let triggeredToggleByMouse = false;
  /** 通过入口转移焦点 */
  let focusedByEntry = false;
  /** 通过出口转移焦点 */
  let focusedByExit = false;
  /** 当前聚焦的列表 */
  let currentList = null;
  /** 通过 outlist 出口失焦 */
  let exitByOutlist = false;

  rootEle.addEventListener("keydown", function(e) {

    const target = e.target;
    const selector = '#' + target.id;

    if (isEscapeEvent(e)) {
      if (currentList != null) {
        const listInfo = listsFocusInfo.get(currentList);
        if (listInfo.escExit) {
          focusedByExit = true;
          document.querySelector(listInfo.escExit).focus();
          updateCurrentList(listInfo.parentList); // 即将落入的列表是当前列表的父列表
          setTimeout(() => focusedByExit = false, 0);
          return;
        }
      }
    }

    const isEntry = entriesMap.has(selector);
    const isExit = !isEntry && exitsMap.has(selector);
    // 当前在入口
    if (isEntry) {
      // 按下 Enter
      if (isEnterEvent(e)) {
        const entryFocusInfo = entriesFocusInfo.get(selector);
        const { delay, toggleEntry, entered } = entryFocusInfo;
        delayToProcess(delay, () => {
          if (toggleEntry && entered) {
            entryFocusInfo.entered = false;
            updateCurrentList(entryFocusInfo.parentList);
          } else {
            focusByEntry(selector, e);
            entryFocusInfo.entered = true;
          }
        });

        return;
      }
    }
    // 当前在出口
    if (isExit) {
      // 按下 Enter
      if (isEnterEvent(e)) {
        const { delay } = exitsFocusInfo.get(selector);
        delayToProcess(delay, () => focusByExit(selector, e));

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
        focusedListItemByNavList = true; // 用于矫正从外部进入列表的焦点
        nextFocusEle.focus();
        delayToProcess(0, () => focusedListItemByNavList = false); // 下一个事件循环重置
        e.preventDefault(); // 阻止默认行为
        return ;
      }
    }

    const curListInfo = listsFocusInfo.get(currentList);
    /** 当前是否范围模式列表 */
    const isRangeList = curListInfo && curListInfo.range;
    /** 是否是列表的元素 */
    const isSequenceListItem = !isRangeList && currentList && currentList.includes(selector);
    // 当前在列表（列表为序列模式）
    if (isSequenceListItem) {
      const itemsLen = currentList.length;
      const lastFocusIdx = getNextIdxByLastFocusIdxAndInitFocusIdx(curListInfo.lastFocusIdx, curListInfo.initFocusIdx, itemsLen);
      if (isTabForward(e)) {
        /** 下一个聚焦元素的 id */
        const nextFocusIdx = (lastFocusIdx + 1) % itemsLen;
        focusNext(nextFocusIdx);
      }
      else if (isTabBackward(e)) {
        const nextFocusIdx = (lastFocusIdx - 1 + itemsLen) % itemsLen;
        focusNext(nextFocusIdx);
      }

      /** 聚焦下一个元素 */
      function focusNext(nextFocusIdx) {
        curListInfo.lastFocusIdx = nextFocusIdx; // 更新 lastFocusIdx
        const nextFocusedEle = document.querySelector(currentList[nextFocusIdx]);
        focusedListItemByNavList = true; // 用于矫正从外部进入列表的焦点
        nextFocusedEle.focus(); // 聚焦
        e.preventDefault(); // 阻止默认行为
        delayToProcess(0, () => focusedListItemByNavList = false); // 下一个事件循环重置
      };
    }
    // 当前在范围模式的列表
    else if (isRangeList) {
      if (isTabForward(e)) {
        const rangeTailTarget = tabPortal.get(selector);
        if (rangeTailTarget != null) {
          document.querySelector(rangeTailTarget).focus(); // 聚焦
          e.preventDefault(); // 阻止默认行为
        }
      }
      if (isTabBackward(e)) {
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
    const isEntry = entriesMap.has(selector);
    const isExit = !isEntry && exitsMap.has(selector);
    if (isEntry) {
      const entryFocusInfo = entriesFocusInfo.get(selector);
      const { delay, toggleEntry, entered } = entryFocusInfo;
      delayToProcess(delay, () => {
        if (toggleEntry && entered) {
          entryFocusInfo.entered = false;
          updateCurrentList(entryFocusInfo.parentList);
        } else {
          if (focusedByEntry) return; // 若是已通过 keydown 入口进入，则无需再从这里的 click 入口进入，打断
          focusByEntry(selector, e);
          entryFocusInfo.entered = true;
        }
      });
    }
    if (isExit) {
      const { delay } = exitsFocusInfo.get(selector);
      delayToProcess(delay, () => {
        focusByExit(selector, e);
      });
    }
  });

  rootEle.addEventListener("focusin", function(e) {

    if (focusedByEntry || focusedByExit || exitByOutlist) return;

    // 没有意图的聚焦，则进行矫正；诸如触发入口、出口、列表导航的聚焦，都是有意图的。
    if (focusedListItemByNavList === false && focusedListItemByMouse === false) {
      const target = e.target;
      const selector = '#' + target.id;
      /** 包含当前元素的列表 */
      const listHadItem = sequenceLists.find(li => li.includes(selector));
      const curListInfo = listsFocusInfo.get(listHadItem);
      if (curListInfo) {
        const nextFocusIdx = getNextIdxByLastFocusIdxAndInitFocusIdx(curListInfo.lastFocusIdx, curListInfo.initFocusIdx, listHadItem.length);
        document.querySelector(listHadItem[nextFocusIdx]).focus();
        updateCurrentList(listHadItem);
        e.preventDefault();
      }
    }
  });

  rootEle.addEventListener("focusout", function() {
    // 用于保护可切换的入口（开关，同时作为出口的入口）能够被触发；也可用 relatedTarget 判断，但 relatedTarget 不兼容 Safari（23.09.08）
    if (triggeredToggleByMouse)
      return triggeredToggleByMouse = false;

    // 若是通过入口或出口转移焦点，则无需触发 outlist 出口
    if (focusedByEntry || focusedByExit)
      return;

    setTimeout(() => {
      const active = getActiveElement();
      /** 失焦元素是否是列表的元素 */
      const prevActiveListInfo = listsFocusInfo.get(currentList);
      // 失焦元素是列表元素，并且有 outlist 退出类型
      if (currentList != null && prevActiveListInfo.outlistExit) {
        // 当前的焦点不在列表之中
        if (!document.querySelector(prevActiveListInfo.wrap).contains(active)) {
          exitByOutlist = true; // 由于事件循环，本行必须位于 `.focus()` 之上
          document.querySelector(prevActiveListInfo.outlistExit).focus();
          setTimeout(() => exitByOutlist = false, 0);
          updateCurrentList(prevActiveListInfo.parentList);
          const entryFocusInfo = entriesFocusInfo.get(prevActiveListInfo.outlistExit);
          entryFocusInfo.entered = false;
        }
      }
    }, 0);
  });

  rootEle.addEventListener("mousedown", function(e) {

    const target = e.target;
    const selector = '#' + target.id;

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

    updateCurrentList(wrappedList);

    // 若是序列模式，则要更新序列最后被聚焦的元素
    if (isSequenceList)
      updateListLastFocusIdx(selector, wrappedList);

    /** 是否是开关入口 */
    const isToggle = entriesMap.has(selector) && entriesFocusInfo.get(selector).toggleEntry;
    triggeredToggleByMouse = isToggle;

    /** 具体点击到了列表内的某个元素 */
    function focusedListItem() {
      focusedListItemByMouse = true;
      delayToProcess(0, () => focusedListItemByMouse = false);
    }
  });

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
    const entryList = entriesMap.get(selector);
    updateCurrentList(entryList);
    const curListInfo = listsFocusInfo.get(entryList);
    focusedByEntry = true; // 本行放在 `.focus` 之上是必须的，事件循环相关
    const nextIdx = getNextIdxByLastFocusIdxAndInitFocusIdx(curListInfo?.lastFocusIdx, curListInfo?.initFocusIdx, entryList.length);
    document.querySelector(entryList[nextIdx]).focus();
    setTimeout(() => focusedByEntry = false, 0);
  }

  /** 通过出口返回至入口 */
  function focusByExit(selector, e) {
    e.preventDefault();
    const exitTarget = exitsMap.get(selector);
    focusedByExit = true; // 本行放在 `.focus` 之上是必须的，事件循环相关
    document.querySelector(exitTarget).focus();
    const entryFocusInfo = entriesFocusInfo.get(exitTarget);
    entryFocusInfo.entered = false;
    updateCurrentList(entryFocusInfo.parentList);
    setTimeout(() => focusedByExit = false, 0);
  }

  /** 更新当前聚焦的列表 */
  function updateCurrentList(list) {
    currentList = list;
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

  const entriesMap = new Map();
  const exitsMap = new Map();
  const sequenceLists = [];
  const tabPortal = new Map();
  const shiftTabPortal = new Map();
  const entriesFocusInfo = new Map();
  const exitsFocusInfo = new Map();
  const listsFocusInfo = new Map();
  const listWrapInfo = new Map();

  travelConfig(obj, null, onConfigObject);

  return {
    /** 用于确定入口的目标 */
    entriesMap,
    /** 用于确定出口的目标 */
    exitsMap,
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
    listWrapInfo
  };

  /** 遍历到配置的对象时执行 */
  function onConfigObject(obj, pureList, parentList) {
    const { entry, exit, range, delayEntry, delayExit, outlistExit, toggleEntry, escapeExit, listWrap, initActive } = obj;
    /** 是否是范围模式 */
    const isRangeMode = range === true;
    if (isRangeMode) { // 是否范围模式
      const head = pureList[0];
      const tail = pureList.at(-1);
      tabPortal.set(tail, head);
      shiftTabPortal.set(head, tail);
    } else
      sequenceLists.push(pureList);
    entriesMap.set(entry, pureList);
    exitsMap.set(exit, entry);
    entriesFocusInfo.set(entry, {
      delay: delayEntry,
      entered: false, // 是否进入
      toggleEntry, // 该入口是否同时支持退出？
      parentList,
    });
    exitsFocusInfo.set(exit, {
      delay: delayExit,
      parentList,
    });
    listsFocusInfo.set(pureList, {
      initFocusIdx: initActive, // 首次聚焦元素 id
      lastFocusIdx: -1, // 最后一次聚焦的 id
      outlistExit: outlistExit ? entry : false, // 蒙层出口
      escExit: escapeExit ? entry : false, // esc 出口
      parentList,
      wrap: listWrap,
      range: isRangeMode,
    });
    listWrapInfo.set(listWrap, pureList);
  }
}

/** 遍历配置 */
function travelConfig(obj, parentList, onConfigObject) {
  // 是否为数组
  if (Array.isArray(obj)) {

    for (const ele of obj) {
      travelConfig(ele, parentList, onConfigObject);
    }
  } else if (isObj(obj)) { // 是否为对象
    const { list } = obj;
    /** 不包含子信息的纯列表 */
    const pureList = list.map(i => isObj(i) ? i.entry : i);
    onConfigObject(obj, pureList, parentList);
    travelConfig(list, pureList, onConfigObject);
  }
}

export default focusky;