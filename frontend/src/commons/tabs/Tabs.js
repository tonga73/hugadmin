import React, { useState, useEffect } from "react";

import { v4 } from "node-uuid";

export const Tabs = ({ children }: { children: ReactNode }) => {
  return (
    <div className="grid grid-rows-6 gap-y-1">
      <div className="row-span-1">{TabsPanel({ children })}</div>
      <div className="row-span-5">{TabsContent()}</div>
    </div>
  );
};

const Tab = ({ name }) => {
  return (
    <button key={v4()} type="button" className="">
      {name}
    </button>
  );
};

export const TabsPanel = ({ children }: { children: ReactNode }) => {
  const [tabs, setTabs] = useState(children);

  useEffect(() => {
    setTabs(children);
  }, [tabs]);
  return (
    <nav className="grid grid-flow-col py-3 rounded-sm bg-pink-700">
      {Object.keys(tabs).map((tab, key) => Tab({ name: tabs[key] }))}
    </nav>
  );
};

export const TabsContent = () => {
  return <div>CONTENT</div>;
};
