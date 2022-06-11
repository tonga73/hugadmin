import React from "react";

import { Outlet } from "react-router-dom";

import styles from "./Login.module.css";

export function Login() {
  return (
    <div className={`${styles.loginGrid} dark:bg-slate-900`}>
      <div className={`${styles.formContainer}`}>
        <Outlet />
      </div>
      <div className={`${styles.banner}`}>
        <div className="bg-gradient-to-r from-slate-900 via-transparent bg-opacity-30 h-full">
          <div className="bg-gradient-to-r from-slate-900 h-full"></div>
        </div>
      </div>
      <div className="absolute right-24 top-60 duration-1000 pointer-events-none select-none">
        <div className="animate-pulse text-transparent text-8xl bg-clip-text bg-gradient-to-r font-thin from-purple-700 via-purple-700 to-slate-900 opacity-80 uppercase">
          hugadmin
        </div>
        <div className="absolute -bottom-36 right-40 text-slate-300 text-opacity-70">
          gestor de expedientes digitales
        </div>
      </div>
    </div>
  );
}
