import React, { useState, useEffect } from "react";

import { Records } from "../records/Records";
import { UserSettings } from "../userSettings/UserSettings";
import { RecordsFiltersBar } from "../recordsFiltersBar/RecordsFiltersBar";
import { Transition } from "@headlessui/react";

export function DashboardAside(props) {
  const [isShowing, setIsShowing] = useState(true);
  const mode = props.mode;

  if (mode === "settings-menu") {
    return (
      <Transition.Child
        enter="transition-opacity duration-1000"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition-opacity duration-1000"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <UserSettings />
      </Transition.Child>
    );
  }
  return (
    <Transition
      appear={true}
      show={mode !== "settings-menu"}
      enter="transition-opacity duration-1000"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="transition-opacity duration-1000"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <div className="px-5 py-3">
        <RecordsFiltersBar />
        <Records />
      </div>
    </Transition>
  );
}
