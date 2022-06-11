import React from "react";

import { SearchIcon } from "@heroicons/react/solid";

const contentPriority = [
  { name: "Seleccionar..." },
  { name: "Inactivo" },
  { name: "Nula" },
  { name: "Baja" },
  { name: "Media" },
  { name: "Alta" },
  { name: "Urgente" },
];

export const RecordFormSearch = React.forwardRef(
  ({ defaultValue, selectOptions, onChange, onBlur, name, disabled }, ref) => (
    <div className="w-1/2">
      <input
        disabled={disabled}
        className={`${
          disabled ? "bg-transparent" : "shadow-md dark:bg-slate-800"
        } w-full flex h-9 px-2 py-0 text-sm rounded-sm appearance-none`}
        name={name}
        type="search"
        ref={ref}
        onChange={onChange}
        onBlur={onBlur}
        defaultValue={defaultValue}
      />
      {!disabled && (
        <div className="relative pointer-events-none opacity-50">
          <div className="absolute h-5 w-5 right-2 bottom-2">
            <SearchIcon />
          </div>
        </div>
      )}
    </div>
  )
);
