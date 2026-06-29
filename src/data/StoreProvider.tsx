import { useEffect, useReducer, ReactNode } from "react";
import { StoreContext, StoreCtx, loadState, reducer } from "./store";

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);

  useEffect(() => {
    try {
      localStorage.setItem("arasi_cafe_v1", JSON.stringify(state));
    } catch {}
  }, [state]);

  const value: StoreCtx = { state, dispatch };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
