import React from "react";

import { CogIcon, XIcon } from "@heroicons/react/outline";

import styles from "./UserBar.module.css";

export function UserBar(props) {
  const onClick = props.onClick;
  const mode = props.mode;

  function SettingsToggleButtons() {
    if (mode === "settings-menu") {
      return <XIcon className="h-6 w-6" aria-hidden="true" />;
    }
    return <CogIcon className="h-6 w-6" aria-hidden="true" />;
  }

  function UserBarTitle() {
    if (mode === "settings-menu") {
      return "Configuración";
    }
    return "Maikel";
  }

  return (
    <div className={styles.userBarGrid}>
      <div className={styles.userBarTitle}>
        <UserBarTitle />
      </div>
      <div className={styles.userBarSettings}>
        <button onClick={onClick} type="button">
          <SettingsToggleButtons />
        </button>
      </div>
    </div>
  );
}
