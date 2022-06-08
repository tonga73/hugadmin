import React, { useState, useEffect } from "react";
import { Transition } from "@headlessui/react";

import { RecordsFiltersBar } from "../recordsFiltersBar/RecordsFiltersBar";

export function Records() {
  const [isShowing, setIsShowing] = useState(true);

  return (
    <Transition
      className="h-full text-center py-8 px-5"
      appear={true}
      show={isShowing}
      enter="transition-opacity duration-1000"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="transition-opacity duration-1000"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <RecordsFiltersBar />
      Records aqui
    </Transition>
  );
}
