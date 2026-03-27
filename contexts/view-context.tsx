"use client";

import { createContext, useContext, useState } from "react";

interface ViewContextValue {
  isFocus: boolean;
  setIsFocus: (v: boolean) => void;
}

const ViewContext = createContext<ViewContextValue>({
  isFocus: false,
  setIsFocus: () => {},
});

export function ViewProvider({
  defaultIsFocus,
  children,
}: {
  defaultIsFocus: boolean;
  children: React.ReactNode;
}) {
  const [isFocus, setIsFocus] = useState(defaultIsFocus);
  return (
    <ViewContext.Provider value={{ isFocus, setIsFocus }}>
      {children}
    </ViewContext.Provider>
  );
}

export const useView = () => useContext(ViewContext);
