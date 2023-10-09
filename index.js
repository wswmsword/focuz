import { delayToProcess, getActiveElement, isEnterEvent, isEscapeEvent, isObj, isTabBackward, isTabForward } from "./utils";

/** 焦点天空 */
function focusky(config) {

  const {
      entriesMap, exitsMap,
      root,
      lists,
      tabPortal, shiftTabPortal,
      entriesFocusInfo, exitsFocusInfo, listsFocusInfo } = resolveFocusConfig(config);

  const rootEle = document.querySelector(root);

  /** 当前聚焦的列表元素是通过键盘导航聚焦的 */
  let focusedListItemByNavList = false;
  /** 当前聚焦的列表元素是通过点击聚焦的 */
  let focusedListItemByMouse = false;

  rootEle.addEventListener("keydown", function(e) {

    const target = e.target;
    const selector = '#' + target.id;
    const isEntry = entriesMap.has(selector);
    const isExit = exitsMap.has(selector);
    /** 包含当前元素的列表 */
    const listHadItem = lists.find(li => li.includes(selector));
    /** 是否是列表的元素 */
    const isSequenceListItem = listHadItem != null;
    // 当前在入口
    if (isEntry) {
      // 按下 Enter
      if (isEnterEvent(e)) {
        const entryFocusInfo = entriesFocusInfo.get(selector);
        const { delay, toggleEntry, entered } = entryFocusInfo;
        delayToProcess(delay, () => {
          if (toggleEntry && entered) {
            entryFocusInfo.entered = false;
          } else {
            focusByEntry(selector, e);
            entryFocusInfo.entered = true;
          }
        });
      }
    }
    // 当前在出口
    if (isExit) {
      // 按下 Escape
      if (isEscapeEvent(e)) {
        const { delay } = exitsFocusInfo.get(selector);
        delayToProcess(delay, () => focusByExit(selector, e));
      }
    }
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
        nextFocusedEle.focus(); // 聚焦
        focusedListItemByNavList = true; // 用于矫正从外部进入列表的焦点
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
        document.querySelector(rangeHeadTarget).focus(); // 聚焦
        e.preventDefault(); // 阻止默认行为
      }
    }
  });

  rootEle.addEventListener("click", function(e) {

    const target = e.target;
    const selector = '#' + target.id;
    const isEntry = entriesMap.has(selector);
    const isExit = exitsMap.has(selector);
    if (isEntry) {
      const entryFocusInfo = entriesFocusInfo.get(selector);
      const { delay, toggleEntry, entered } = entryFocusInfo;
      delayToProcess(delay, () => {
        if (toggleEntry && entered) {
          entryFocusInfo.entered = false;
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

    // 如果不是通过导航聚焦的列表元素，则需要矫正
    if (focusedListItemByNavList === false && focusedListItemByMouse === false) {
      /** 包含当前元素的列表 */
      const listHadItem = lists.find(li => li.includes(selector));
      const curListInfo = listsFocusInfo.get(listHadItem);
      if (curListInfo) {
        const lastFocusIdx = curListInfo.lastFocusIdx;
        document.querySelector(listHadItem[lastFocusIdx]).focus();
        e.preventDefault();
      }
    }
  });

  rootEle.addEventListener("focusout", function(e) {
    setTimeout(() => {
      const active = getActiveElement();
      /** 失焦之后聚焦的元素 */
      const activeSelector = '#' + active.id;
      /** 失焦的元素 */
      const prevActiveSelector = '#' + e.target.id;

      /** 失焦元素所在列表 */
      const listHadPrevActiveItem = lists.find(li => li.includes(prevActiveSelector));
      /** 失焦元素是否是列表的元素 */
      const isSequenceListPrevActiveItem = listHadPrevActiveItem != null;
      const prevActiveListInfo = listsFocusInfo.get(listHadPrevActiveItem);
      // 失焦元素是列表元素，并且有 outlist 退出类型
      if (isSequenceListPrevActiveItem && prevActiveListInfo.outlistExit) {
        // 当前的焦点不在之前的列表中
        if (!listHadPrevActiveItem.includes(activeSelector)) {
          // 之前的焦点不能是入口和出口
          if (entriesMap.has(prevActiveSelector) == null && exitsMap.has(prevActiveSelector) == null) {
            // 当前焦点不能是原列表的入口
            if (!(prevActiveListInfo.outlistExit === activeSelector &&
              entriesFocusInfo.get(prevActiveListInfo.outlistExit).toggleEntry)) {
              document.querySelector(prevActiveListInfo.outlistExit).focus();
              const entryFocusInfo = entriesFocusInfo.get(prevActiveListInfo.outlistExit);
              entryFocusInfo.entered = false;
            }
          }
        }
      }
    }, 0);
  });

  rootEle.addEventListener("mousedown", function(e) {

    const target = e.target;
    const selector = '#' + target.id;
    /** 包含当前元素的列表 */
    const listHadItem = lists.find(li => li.includes(selector));
    /** 是否是列表的元素 */
    const isSequenceListItem = listHadItem != null;
    if (isSequenceListItem) {
      updateListLastFocusIdx(selector, listHadItem);
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
    const curListInfo = listsFocusInfo.get(entryList);
    document.querySelector(entryList[curListInfo?.lastFocusIdx || 0]).focus();
  }

  /** 通过出口返回至入口 */
  function focusByExit(selector, e) {
    e.preventDefault();
    const exitTarget = exitsMap.get(selector);
    document.querySelector(exitTarget).focus();
    const entryFocusInfo = entriesFocusInfo.get(exitTarget);
    entryFocusInfo.entered = false;
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
  entriesFocusInfo = new Map(), exitsFocusInfo = new Map(), listsFocusInfo = new Map()) {

  // 是否为数组
  if (Array.isArray(obj)) {

    for (const ele of obj) {
      generateFocusDataByTravellingConfig(ele, entriesMap, exitsMap, lists, tabPortal, shiftTabPortal, entriesFocusInfo, exitsFocusInfo, listsFocusInfo);
    }
  } else if (isObj(obj)) { // 是否为对象

    const { entry, exit, list, range, delayEntry, delayExit, outlistExit, toggleEntry } = obj;
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
    });
    exitsFocusInfo.set(exit, {
      delay: delayExit
    });
    listsFocusInfo.set(pureList, {
      lastFocusIdx: 0, // 最后一次聚焦的 id
      outlistExit: outlistExit ? entry : false,
    });
    generateFocusDataByTravellingConfig(list, entriesMap, exitsMap, lists, tabPortal, shiftTabPortal, entriesFocusInfo, exitsFocusInfo, listsFocusInfo);
  }

  return { entriesMap, exitsMap, lists, tabPortal, shiftTabPortal, entriesFocusInfo, exitsFocusInfo, listsFocusInfo };
}

export default focusky;