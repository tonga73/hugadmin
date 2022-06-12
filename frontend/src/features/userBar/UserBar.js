import React from "react";
import { Link } from "react-router-dom";

import { Transition } from "@headlessui/react";
import { CogIcon, XIcon, ShieldCheckIcon } from "@heroicons/react/outline";

import styles from "./UserBar.module.css";

export function UserBar(props) {
  const onClick = props.onClick;
  const mode = props.mode;
  const user = props.user;
  const isShowing = true;

  function SettingsToggleButtons() {
    if (mode === "settings-menu") {
      return <XIcon className="h-6 w-6" aria-hidden="true" />;
    }
    return <CogIcon className="h-6 w-6" aria-hidden="true" />;
  }

  const UserBarTitle = () => {
    function Title({ children }) {
      return (
        <div
          className={`  ${
            mode === "settings-menu"
              ? "text-lg uppercase font-bold tracking-tighter text-slate-700"
              : mode === "list-records"
              ? "text-4xl font-light -tracking-wide text-slate-200"
              : ""
          }   w-full h-12 px-1 flex items-center`}
        >
          {children}
        </div>
      );
    }
    function setTitle() {
      switch (mode) {
        case "settings-menu":
          return "Configuración";

        case "list-records":
          return user.name;

        default:
          break;
      }
    }
    return (
      <>
        <div className={`${styles.userBarTitle} `}>
          {Title({ children: setTitle() })}
        </div>
      </>
    );
  };

  return (
    <Transition
      appear={true}
      show={isShowing}
      enter="transition ease-in-out duration-1000 transform"
      enterFrom="-translate-y-full"
      enterTo="translate-y-0"
      leave="transition ease-in-out duration-1000 transform"
      leaveFrom="translate-y-0"
      leaveTo="-translate-y-full"
    >
      <div className={styles.userBarGrid}>
        {UserBarTitle()}
        <div className={`${styles.userBarSettings}`}>
          <Link
            to="/admin-panel"
            type="button"
            className="border border-opacity-30 opacity-30 border-slate-500 text-slate-500 p-0.5 rounded-full hover:opacity-100 transition-opacity"
          >
            <ShieldCheckIcon className="h-6 w-6" aria-hidden="true" />
          </Link>
          <button
            onClick={onClick}
            type="button"
            className="border border-opacity-30 opacity-30 border-slate-500 text-slate-500 p-0.5 rounded-full hover:opacity-100 transition-opacity"
          >
            <SettingsToggleButtons />
          </button>
        </div>
      </div>
    </Transition>
  );
}
