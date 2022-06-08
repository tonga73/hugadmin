import React from "react";

import { Outlet } from "react-router-dom";

import styles from "./Login.module.css";

export function Login() {
  return (
    <div className={`${styles.loginGrid} dark:bg-slate-800`}>
      <div className={`${styles.formContainer}`}>
        <Outlet />
      </div>
      <div className={`${styles.banner}`}></div>
    </div>
  );
}
