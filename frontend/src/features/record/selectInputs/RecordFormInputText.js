import React from "react";

import { SearchIcon } from "@heroicons/react/solid";

export const RecordFormInputText = React.forwardRef(
  (
    { defaultValue, selectOptions, onChange, onBlur, name, disabled, styles },
    ref
  ) => (
    <div className="w-full">
      <input
        disabled={disabled}
        className={`${
          disabled ? "bg-transparent" : "shadow-md dark:bg-slate-800"
        } w-full flex px-2 py-0 rounded-sm appearance-none ${styles}`}
        name={name}
        type="search"
        ref={ref}
        onChange={onChange}
        onBlur={onBlur}
        defaultValue={defaultValue}
      />
      {/* {!disabled && (
        <div className="relative pointer-events-none opacity-50">
          <div className="absolute h-5 w-5 right-2 bottom-2">
            <SearchIcon />
          </div>
        </div>
      )} */}
    </div>
  )
);
