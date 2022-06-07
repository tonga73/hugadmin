import React from "react";

import { ArrowsExpandIcon, BackspaceIcon } from "@heroicons/react/outline";

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
      <button type="button">
        <FullscreenToggleIcon />
      </button>
    </nav>
  );
}
