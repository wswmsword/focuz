import React, { useMemo, useRef } from "react";
import { Context, ContextForEntry, ContextForExit } from "./context";

export default function Focuz({ children, onEntry, onExit }) {
  const head = useRef();
  const tail = useRef();
  const list = useRef([]);
  const entries = useRef([]);
  const exits = useRef([]);
  const contextVal = useMemo(() => ({
    head,
    tail,
    list,
    entries,
    exits,
  }), []);
  return <Context.Provider value={contextVal}>
    <ContextForEntry.Provider value={{ onEntry }}>
      <ContextForExit.Provider value={{ onExit }}>
        {children}
      </ContextForExit.Provider>
    </ContextForEntry.Provider>
  </Context.Provider>;
}
