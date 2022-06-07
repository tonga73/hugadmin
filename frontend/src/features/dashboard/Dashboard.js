import React, { useState, useEffect } from "react";

import { UserBar } from "../userBar/UserBar";
import { DashboardAside } from "../dashboardAside/DashboardAside";
import { DashboardTopBar } from "../dashboardTopBar/DashboardTopBar";

import { Transition } from "@headlessui/react";

import { ArrowsExpandIcon, BackspaceIcon } from "@heroicons/react/outline";

import styles from "./Dashboard.module.css";

export function Dashboard({}) {
  const [mode, setMode] = useState("list-records");

  const [isShowing, setIsShowing] = useState(false);

  function toggleSettings() {
    if (mode === "settings-menu") {
      setMode("list-records");
    }
    if (mode === "list-records") {
      setMode("settings-menu");
    }
  }

  function toggleFullScreen() {
    if (mode === "full-screen") {
      setMode("list-records");
    }
    if (mode === "list-records") {
      setMode("full-screen");
    }
  }

  function toggleStyles(value) {
    if (mode === "full-screen") {
      return "Fullscreen" + value;
    }
    if (mode === "list-records") {
      return value;
    }
  }

  useEffect(() => {
    setIsShowing(true);
  }, [isShowing]);

  return (
    <div
      className={`${
        mode !== "full-screen"
          ? styles.dashboardGrid
          : styles.dashboardGridFullscreen
      } dark:bg-slate-800`}
    >
      <div
        className={`${
          mode !== "full-screen"
            ? styles.dashboardAside
            : styles.dashboardAsideFullscreen
        } dark:text-slate-200`}
      >
        <Transition show={isShowing}>
          <Transition.Child
            enter="transition ease-in-out duration-1000 transform"
            enterFrom="-translate-y-full"
            enterTo="translate-y-0"
            leave="transition ease-in-out duration-1000 transform"
            leaveFrom="translate-y-0"
            leaveTo="-translate-y-full"
          >
            <UserBar onClick={toggleSettings} mode={mode} />
          </Transition.Child>
          <Transition.Child
            enter="transition-opacity duration-1000"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity duration-1000"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <DashboardAside mode={mode} />
          </Transition.Child>
        </Transition>
      </div>
      <div
        className={`${
          mode !== "full-screen" ? styles.dashboard : styles.dashboardFullscreen
        } dark:bg-slate-900`}
      >
        <DashboardTopBar onClick={toggleFullScreen} mode={mode} />
      </div>
    </div>
  );
}
