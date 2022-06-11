import React from "react";

import {
  ArrowsExpandIcon,
  BackspaceIcon,
  SaveIcon,
} from "@heroicons/react/outline";

import styles from "./DashboardTopBar.module.css";

export function DashboardTopBar(props) {
  const onClick = props.onClick;
  const mode = props.mode;
  function FullscreenToggleIcon() {
    if (mode === "full-screen") {
      return (
        <BackspaceIcon
          onClick={onClick}
          className="h-6 w-6"
          aria-hidden="true"
        />
      );
    }
    return (
      <ArrowsExpandIcon
        onClick={onClick}
        className="h-6 w-6"
        aria-hidden="true"
      />
    );
  }
  return (
    <nav className={styles.dashboardTopBar}>
      <div>
        <button
          type="submit"
          form="addNewRecordForm"
          className={`inline-flex items-center gap-x-1.5 px-3 py-1 rounded-sm hover:-translate-y-1 transition-transform text-slate-200 bg-green-800`}
        >
          Guardar
          <SaveIcon className="h-5 w-5" />
        </button>
      </div>
      <div></div>
      <div className="flex justify-end">
        <button type="button">
          <FullscreenToggleIcon />
        </button>
      </div>
    </nav>
  );
}
