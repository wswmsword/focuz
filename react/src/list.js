import React, { cloneElement, useContext, useRef } from "react";
import { Context, ContextForExit } from "./context";

/** 焦点列表 */
export default function List({ children }) {
  const wrapper = useRef();
  const { head, tail, entries } = useContext(Context);
  const { onExit } = useContext(ContextForExit);
  return cloneElement(children, {
    onKeyDown(e) {
      // 退出列表
      if (e.key === "Escape" || e.keyCode === 27) {
        const target = entries.current[0];
        target && target.focus();
        e.preventDefault();
        onExit && onExit();
      }
      // 焦点矫正
      else if (e.target === wrapper.current) {
        if (e.key === "Tab" || e.keyCode === 9) {
          if (e.shiftKey) {
            focusRef(tail, e);
          } else {
            focusRef(head, e);
          }
        }
      }
      // 回尾
      else if (e.target === head.current && (e.key === "Tab" || e.keyCode === 9) && e.shiftKey) {
        focusRef(tail, e);
      }
      // 回头
      else if (e.target === tail.current && (e.key === "Tab" || e.keyCode === 9) && !e.shiftKey) {
        focusRef(head, e);
      }
    },
    ref(e) {
      wrapper.current = e;
    },
    tabIndex: -1,
  });
}

function focusRef(r, e) {
  r.current && r.current.focus();
  e.preventDefault();
}