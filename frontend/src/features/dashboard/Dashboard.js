import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";

import { delay } from "../../app/helpers/delay";

import { DashboardAside } from "../dashboardAside/DashboardAside";
import { DashboardTopBar } from "../dashboardTopBar/DashboardTopBar";
import { Record } from "../record/Record";

import {
  setUser,
  selectToken,
  selectUserStatus,
} from "../userBar/userBarSlice";
import {
  getRecord,
  selectRecord,
  setRecord,
  selectRecordStatus,
} from "../record/recordSlice";
import { getRecords, selectRecords, setRecords } from "../records/recordsSlice";

import styles from "./Dashboard.module.css";

export function Dashboard() {
  const dispatch = useDispatch();
  const userStatus = useSelector(selectUserStatus);
  const records = useSelector(selectRecords);
  const token = useSelector(selectToken);

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
    dispatch(setUser({ status: "" }));
    dispatch(setRecord({ status: "loading" }));
    dispatch(setRecords({ status: "loading" }));
    delay(1500).then((res) => {
      dispatch(getRecords());
      dispatch(setRecords({ status: "" }));
    });
  }, [token]);

  return (
    <div className={styles.dashboardBackgroundContainer}>
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
            mode !== "full-screen"
              ? styles.dashboard
              : styles.dashboardFullscreen
          } dark:bg-slate-800 dark:bg-opacity-60 dark:shadow-slate-700`}
        >
          <DashboardTopBar onClick={toggleFullScreen} mode={mode} />
          <Record />
        </div>
      </div>
    </div>
  );
}
