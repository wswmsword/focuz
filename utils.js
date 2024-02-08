/** Object.prototype.toString.call 快捷方式 */
export const objToStr = obj => Object.prototype.toString.call(obj);

/** 参数是否是对象 */
export const isObj = obj => objToStr(obj) === "[object Object]";

/** 参数是否为字符串 */
export const isStr = str => typeof str === "string";

/** 是否按下了 enter */
export const isEnterEvent = function(e) {
  return e.key === "Enter" || e.keyCode === 13;
};

/** 按键是否是 esc */
export const isEscapeEvent = function (e) {
  return e.key === 'Escape' || e.key === 'Esc' || e.keyCode === 27;
};

/** 按键是否是 tab */
export const isTabEvent = function(e) {
  return e.key === 'Tab' || e.keyCode === 9;
};

/** 是否是向前的 tab */
export const isTabForward = function(e) {
  return isTabEvent(e) && !e.shiftKey;
};

/** 是否是向后的 tab */
export const isTabBackward = function(e) {
  return isTabEvent(e) && e.shiftKey;
};

/** 延迟执行 */
export const delayToProcess = function(after) {
  return function (delay, processor) {
    if (delay == null) f();
    else setTimeout(f, delay);

    function f() {
      processor();
      after();
    }
  }
};

/** document.activeElement 的快捷方式 */
export const getActiveElement = () => document.activeElement;

/** 为执行函数添加条件 */
export function addCondition(condition, processor) {
  return function(...props) {
    if (condition()) processor(...props);
  };
}

/** 找到两个元素的最小公共祖先元素 */
export const findLowestCommonAncestorNode = function(x, y) {
  if (x == null || y == null) return null;
  if (x.contains(y)) return x;
  if (y.contains(x)) return y;

  const range = new Range();
  range.setStartBefore(x);
  range.setEndAfter(y);
  if (range.collapsed) {
     range.setStartBefore(y);
     range.setEndAfter(x);
  }
  return range.commonAncestorContainer;
};

/** 找到两个元素的最小公共祖先元素，通过 selector */
export function findLowestCommonAncestorNodeByList(list) {
  const head = document.querySelector(list[0]);
  if (head == null) return null;
  const tail = document.querySelector(list.at(-1));
  if (tail == null) return null;
  const wrapE = findLowestCommonAncestorNode(head, tail);
  return `#${wrapE.id}`;
}
