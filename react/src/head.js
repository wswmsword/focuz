import React, { cloneElement, useContext } from "react";
import { Context } from "./context";

export default function Head({ children }) {
  const { head } = useContext(Context);
  return cloneElement(children, {
    ref(e) {
      head.current = e;
    }
  });
}