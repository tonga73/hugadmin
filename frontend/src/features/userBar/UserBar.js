import React from "react";

import { Transition } from "@headlessui/react";
import { CogIcon, XIcon } from "@heroicons/react/outline";

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

  function UserBarTitle() {
    if (mode === "settings-menu") {
      return "Configuración";
    }
    return user.name;
  }

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
        <div className={styles.userBarTitle}>
          <UserBarTitle />
        </div>
        <div className={styles.userBarSettings}>
          <button onClick={onClick} type="button">
            <SettingsToggleButtons />
          </button>
        </div>
      </div>
    </Transition>
  );
}
