import React, { cloneElement, useContext, useEffect, useRef } from "react";
import { Context, ContextForEntry } from "./context";

/** 入口 */
export default function Entry({ children, on }) {

  const ref = useRef(null);
  const { head, list, entries } = useContext(Context);
  const { onEntry } = useContext(ContextForEntry);
  useEffect(() => {
    entries.current.push(ref.current);
    return () => {
      entries.current = entries.current.filter(e => e !== ref.current);
    };
  }, []);
  return cloneElement(children, {
    onClick(e) {
      const _on = on || onEntry || (() => {});
      _on(e);
      requestAnimationFrame(() => {
        const target = head.current || list.current[0];
        target && target.focus();
      });
    },
    ref(e) {
      if (e) ref.current = e;
    },
  });
}