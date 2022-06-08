import React, { useState, useEffect } from "react";

import { UserBar } from "../userBar/UserBar";
import { Records } from "../records/Records";
import { UserSettings } from "../userSettings/UserSettings";
import { RecordsFiltersBar } from "../recordsFiltersBar/RecordsFiltersBar";
import { Transition } from "@headlessui/react";

import styles from "./DashboardAside.module.css";

export function DashboardAside(props) {
  const [isShowing, setIsShowing] = useState(true);
  const mode = props.mode;
  const onClick = props.onClick;

  function AsideContent() {
    if (mode === "settings-menu") {
      return (
        <>
          <UserSettings />
        </>
      );
    }
    return (
      <>
        <Records />
      </>
    );
  }

  return (
    <div
      className={`${
        mode !== "full-screen"
          ? styles.dashboardAside
          : styles.dashboardAsideFullscreen
      } dark:text-slate-200`}
    >
      <UserBar onClick={onClick} mode={mode} />
      <AsideContent />
    </div>
  );
}
