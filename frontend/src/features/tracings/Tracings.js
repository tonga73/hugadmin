import React from "react";

import { PlusIcon } from "@heroicons/react/solid";

import styles from "./Tracings.module.css";

export function Tracings() {
  const newTracing = ({ styles }) => {
    return (
      <button className={`${styles}`}>
        <PlusIcon />
      </button>
    );
  };
  return (
    <div className={styles.tracingsGrid}>
      {newTracing({ styles: styles.createTracingButton })}
      <div>Tracings. But the real ones.</div>
    </div>
  );
}
