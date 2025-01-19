import React, { cloneElement, useContext, useEffect, useRef } from "react";
import { Context } from "./context";

export default function Item({ children, ...props }) {
  const ref = useRef();
  const { list } = useContext(Context);
  useEffect(() => {
    list.current.push(ref.current);
    return () => {
      list.current = list.current.filter(e => e !== ref.current);
    }
  }, []);
  return cloneElement(children, { ref(e) {
    if (e != null) ref.current = e;
  }, ...props });
}