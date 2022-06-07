import React, { useState } from "react";

import { UserBar } from "../userBar/UserBar";
import { DashboardAside } from "../dashboardAside/DashboardAside";
import { DashboardTopBar } from "../dashboardTopBar/DashboardTopBar";

import { ArrowsExpandIcon, BackspaceIcon } from "@heroicons/react/outline";

import styles from "./Dashboard.module.css";

export function Dashboard() {
  const [mode, setMode] = useState("list-records");

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

  return (
    <div
      className={
        mode !== "full-screen"
          ? styles.dashboardGrid
          : styles.dashboardGridFullscreen
      }
    >
      <div
        className={
          mode !== "full-screen"
            ? styles.dashboardAside
            : styles.dashboardAsideFullscreen
        }
      >
        <UserBar onClick={toggleSettings} mode={mode} />
        <DashboardAside mode={mode} />
      </div>
      <div
        className={
          mode !== "full-screen" ? styles.dashboard : styles.dashboardFullscreen
        }
      >
        <DashboardTopBar onClick={toggleFullScreen} mode={mode} />
      </div>
    </div>
  );
}
