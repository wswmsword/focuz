import { createContext } from "react";

export const Context = createContext({
  head: null,
  tail: null,
  list: [],
  entries: [],
});
export const ContextForEntry = createContext({
  onEntry() {},
});

export const ContextForExit = createContext({
  onExit() {},
});