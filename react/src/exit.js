import React, { useRef, useContext, useEffect, cloneElement } from "react";
import { Context, ContextForExit } from "./context";

/** 出口 */
export default function Exit({ children, on }) {

  const ref = useRef(null);
  const { exits, entries } = useContext(Context);
  const { onExit } = useContext(ContextForExit);

  useEffect(() => {
    exits.current.push(ref.current);
    return () => {
      exits.current = exits.current.filter(e => e !== ref.current);
    };
  }, []);

  return cloneElement(children, {
    onClick(e) {
      const target = entries.current[0];
      target && target.focus();
      const _on = on || onExit || (() => {});
      _on(e);
    },
    ref(e) {
      if (e) ref.current = e;
    }
  });
}