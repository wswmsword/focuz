import React, { cloneElement, useContext } from "react";
import { Context } from "./context";

export default function Tail({ children }) {
  const { tail } = useContext(Context);
  return cloneElement(children, {
    ref(e) {
      tail.current = e;
    }
  });
}