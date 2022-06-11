import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";

import { DashboardAside } from "../dashboardAside/DashboardAside";
import { DashboardTopBar } from "../dashboardTopBar/DashboardTopBar";
import { Record } from "../record/Record";

import { getRecord, selectRecord } from "../record/recordSlice";

import styles from "./Dashboard.module.css";

export function Dashboard() {
  const [mode, setMode] = useState("list-records");
  const [recordsMode, setRecordsMode] = useState("");

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

  useEffect(() => {
    setIsShowing(true);
  }, [isShowing]);

  return (
    <div
      className={`${
        mode !== "full-screen"
          ? styles.dashboardGrid
          : styles.dashboardGridFullscreen
      } dark:bg-slate-900`}
    >
      <DashboardAside onClick={toggleSettings} mode={mode} />
      <div
        className={`${
          mode !== "full-screen" ? styles.dashboard : styles.dashboardFullscreen
        } dark:bg-slate-800 dark:bg-opacity-30 dark:shadow-slate-700`}
      >
        <DashboardTopBar onClick={toggleFullScreen} mode={mode} />
        <Record />
      </div>
    </div>
  );
}
