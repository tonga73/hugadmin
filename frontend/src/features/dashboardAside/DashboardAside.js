import React, { useState } from "react";
import { useSelector } from "react-redux";

import { Transition } from "@headlessui/react";

import { selectUser } from "../userBar/userBarSlice";
import { selectRecords } from "../records/recordsSlice";

import { UserBar } from "../userBar/UserBar";
import { Records } from "../records/Records";
import { UserSettings } from "../userSettings/UserSettings";

import styles from "./DashboardAside.module.css";

export function DashboardAside(props) {
  const user = useSelector(selectUser);
  const mode = props.mode;

  const records = useSelector(selectRecords);

  const [recordsMode, setRecordsMode] = useState({ ...props.recordsMode });
  const onClick = props.onClick;

  function AsideContent() {
    if (mode === "settings-menu") {
      return (
        <>
          <UserSettings />
        </>
      );
    }
    return <>{<Records />}</>;
  }

  return (
    <div
      className={`${
        mode !== "full-screen"
          ? styles.dashboardAside
          : styles.dashboardAsideFullscreen
      } dark:text-slate-200 pb-5`}
    >
      <UserBar onClick={onClick} mode={mode} user={user} />
      <AsideContent />
    </div>
  );
}
