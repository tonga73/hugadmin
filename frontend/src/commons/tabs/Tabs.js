import React, { useState, useEffect } from "react";

import { v4 } from "node-uuid";

export const Tabs = ({ children }: { children: ReactNode }) => {
  const [active, setActive] = useState();
  //   console.log(Object.values(active).map((tab, key) => key));
  const handleClick = (e) => {
    const index = parseInt(e.target.id, 0);
    if (index !== active) {
      setActive(index);
    }
  };
  const tabs = TabsPanel({ children });

  const onClick = (refs) => {
    setActive(refs.target.textContent);
    console.log(refs.target.textContent);
  };

  return (
    <div className="grid grid-rows-6 gap-y-1">
      <div className="row-span-1">{TabsPanel({ children, onClick })}</div>
      <div className="row-span-5">{TabContent({ children, active })}</div>
    </div>
  );
};

const Tab = ({ name, onClick, active }, refs) => {
  return (
    <button
      refs={refs}
      onClick={onClick}
      active={active}
      id={0}
      key={v4()}
      type="button"
      className="bg-pink-700"
    >
      {name}
    </button>
  );
};

const TabsPanel = ({ children, onClick }: { children: ReactNode }, refs) => {
  const [tabs, setTabs] = useState(children);

  useEffect(() => {
    setTabs(children);
  }, [tabs]);
  return (
    <nav className="grid grid-flow-col gap-5 py-3 rounded-sm">
      {Object.keys(tabs).map((tab, key) =>
        Tab({ name: tabs[key], onClick, refs })
      )}
    </nav>
  );
};

const TabContent = (
  {
    name,
    children,
    active,
    id,
  }: {
    children: ReactNode,
  },
  refs
) => {
  const [tabs, setTabs] = useState(children);

  function checkActive(tab) {
    return tab;
  }

  const Content = ({ name, active }, refs) => {
    return (
      <div refs={refs} id={id} key={v4()} className="">
        {name}
      </div>
    );
  };

  return (
    <div className="bg-slate-700 h-full w-full flex items-center justify-center">
      {Content({ name: children.find(checkActive), refs })}
    </div>
  );
};
