import React from "react";
import { useDispatch } from "react-redux";

import { Transition } from "@headlessui/react";

import { logout } from "../userBar/userBarSlice";

import { UserSettingsThemeSelector } from "../userSettingsThemeSelector/UserSettingsThemeSelector";

export function UserSettings() {
  const isShowing = true;
  const dispatch = useDispatch();

  function logOut() {
    dispatch(logout);
  }

  return (
    <Transition
      className="h-full grid"
      appear={true}
      show={isShowing}
      enter="transition-opacity duration-1000"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="transition-opacity duration-1000"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <UserSettingsThemeSelector />
      <div className="row-span-1 row-end-5 px-5">
        <button
          onClick={logOut}
          className="w-full py-3 bg-transparent text-slate-100 border opacity-50 hover:opacity-100 uppercase font-bold"
        >
          Cerrar Sesión
        </button>
      </div>
    </Transition>
  );
}
