import { delayToProcess, getActiveElement, isEnterEvent, isEscapeEvent, isObj, isTabBackward, isTabForward } from "./utils";

/** 焦点天空 */
function focusky(config) {

  const {
    entriesMap, exitsMap,
    root,
    lists,
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
        const nextFocus = curListInfo.range ? currentList.at(-1) : currentList[curListInfo.lastFocusIdx];
        const nextFocusEle = document.querySelector(nextFocus);
        focusedListItemByNavList = true; // 用于矫正从外部进入列表的焦点
        nextFocusEle.focus();
        delayToProcess(0, () => focusedListItemByNavList = false); // 下一个事件循环重置
        e.preventDefault(); // 阻止默认行为
        return ;
      }
    }

    /** 包含当前元素的列表 */
    const listHadItem = lists.find(li => li.includes(selector));
    /** 是否是列表的元素 */
    const isSequenceListItem = listHadItem != null;
    // 当前在列表（列表为序列模式）
    if (isSequenceListItem) {
      const curListInfo = listsFocusInfo.get(listHadItem);
      const lastFocusIdx = curListInfo.lastFocusIdx;
      const itemsLen = listHadItem.length;
      if (isTabForward(e)) {
        /** 下一个聚焦元素的 id */
        const nextFocusIdx = (lastFocusIdx + 1) % itemsLen;
        focusNext(nextFocusIdx);
      }
      if (isTabBackward(e)) {
        const nextFocusIdx = (lastFocusIdx - 1 + itemsLen) % itemsLen;
        focusNext(nextFocusIdx);
      }

      /** 聚焦下一个元素 */
      function focusNext(nextFocusIdx) {
        curListInfo.lastFocusIdx = nextFocusIdx; // 更新 lastFocusIdx
        const nextFocusedEle = document.querySelector(listHadItem[nextFocusIdx]);
        focusedListItemByNavList = true; // 用于矫正从外部进入列表的焦点
        nextFocusedEle.focus(); // 聚焦
        e.preventDefault(); // 阻止默认行为
        delayToProcess(0, () => focusedListItemByNavList = false); // 下一个事件循环重置
      };
    } else {
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
          focusByEntry(selector, e);
          updateListLastFocusIdx(selector);
          entryFocusInfo.entered = true;
        }
      });
    }
    if (isExit) {
      const { delay } = exitsFocusInfo.get(selector);
      delayToProcess(delay, () => {
        focusByExit(selector, e);
        updateListLastFocusIdx(selector);
      });
    }
  });

  rootEle.addEventListener("focusin", function(e) {

    const target = e.target;
    const selector = '#' + target.id;

    if (focusedByEntry || focusedByExit) return;

    // 如果不是通过导航聚焦的列表元素，则需要矫正
    if (focusedListItemByNavList === false && focusedListItemByMouse === false) {
      /** 包含当前元素的列表 */
      const listHadItem = lists.find(li => li.includes(selector));
      const curListInfo = listsFocusInfo.get(listHadItem);
      if (curListInfo) {
        const lastFocusIdx = curListInfo.lastFocusIdx;
        document.querySelector(listHadItem[lastFocusIdx]).focus();
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
      /** 失焦之后聚焦的元素 */
      const activeSelector = active.id ? '#' + active.id : null;
      /** 失焦元素是否是列表的元素 */
      const prevActiveListInfo = listsFocusInfo.get(currentList);
      // 失焦元素是列表元素，并且有 outlist 退出类型
      if (currentList != null && prevActiveListInfo.outlistExit) {
        // 当前的焦点不在列表之中
        if (!document.querySelector(prevActiveListInfo.wrap).contains(document.querySelector(activeSelector))) {
          document.querySelector(prevActiveListInfo.outlistExit).focus();
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

    // 1. 首先通过 wrap 确定列表
    let currentList = listWrapInfo.get(selector);
    if (currentList == null) { // 点到了范围模式的按钮
      const parentEle = e.target.parentElement;
      const parentSelector = '#' + (parentEle || {}).id;
      currentList = listWrapInfo.get(parentSelector);

      focusedListItem();
    }

    // 2. 若无 wrap，则通过列表元素确定列表
    if (currentList == null) {
      /** 包含当前元素的列表 */
      const listHadItem = lists.find(li => li.includes(selector));
      /** 是否是列表的元素 */
      const isSequenceListItem = listHadItem != null;
      if (isSequenceListItem) { // 序列模式，范围模式不确定，因此不考虑
        updateListLastFocusIdx(selector, listHadItem);
        currentList = listHadItem;

        focusedListItem();
      }
    }

    updateCurrentList(currentList);

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
    const listHadItem = list || (lists.find(li => li.includes(selector)));
    /** 是否是列表的元素 */
    const isSequenceListItem = listHadItem != null;
    if (isSequenceListItem) {
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
    document.querySelector(entryList[curListInfo?.lastFocusIdx || 0]).focus();
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

/** 分解焦点配置 */
function resolveFocusConfig(config) {

  // 根元素
  const { root } = config;
  // 一些映射，用于聚焦，例如入口映射、出口映射等
  const maps = generateFocusDataByTravellingConfig(config);
  return {
    root,
    ...maps,
  };
}

/** 遍历配置，生成焦点相关的基础数据 */
function generateFocusDataByTravellingConfig(
  obj,
  entriesMap = new Map(), exitsMap = new Map(),
  lists = [],
  tabPortal = new Map(), shiftTabPortal = new Map(),
  entriesFocusInfo = new Map(), exitsFocusInfo = new Map(), listsFocusInfo = new Map(),
  listWrapInfo = new Map(),
  parentList = null) {

  // 是否为数组
  if (Array.isArray(obj)) {

    for (const ele of obj) {
      generateFocusDataByTravellingConfig(ele, entriesMap, exitsMap, lists, tabPortal, shiftTabPortal, entriesFocusInfo, exitsFocusInfo, listsFocusInfo, listWrapInfo, parentList);
    }
  } else if (isObj(obj)) { // 是否为对象

    const { entry, exit, list, range, delayEntry, delayExit, outlistExit, toggleEntry, escapeExit, listWrap } = obj;
    /** 是否是范围模式 */
    const isRangeMode = range === true;
    /** 不包含子信息的纯列表 */
    const pureList = list.map(i => isObj(i) ? i.entry : i);
    if (isRangeMode) { // 是否范围模式
      const head = pureList[0];
      const tail = pureList.at(-1);
      tabPortal.set(tail, head);
      shiftTabPortal.set(head, tail);
    } else
      lists.push(pureList);
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
      lastFocusIdx: 0, // 最后一次聚焦的 id
      outlistExit: outlistExit ? entry : false, // 蒙层出口
      escExit: escapeExit ? entry : false, // esc 出口
      parentList,
      wrap: listWrap,
      range: isRangeMode,
    });
    listWrapInfo.set(listWrap, pureList);
    generateFocusDataByTravellingConfig(list, entriesMap, exitsMap, lists, tabPortal, shiftTabPortal, entriesFocusInfo, exitsFocusInfo, listsFocusInfo, listWrapInfo, pureList);
  }

  return { entriesMap, exitsMap, lists, tabPortal, shiftTabPortal, entriesFocusInfo, exitsFocusInfo, listsFocusInfo, listWrapInfo };
}

export default focusky;