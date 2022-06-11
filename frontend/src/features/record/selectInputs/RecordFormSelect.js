import React from "react";

import { ArrowDownIcon } from "@heroicons/react/solid";

export const RecordFormSelect = React.forwardRef(
  ({ defaultValue, selectOptions, onChange, onBlur, name, disabled }, ref) => (
    <div className="w-full">
      <select
        disabled={disabled}
        className={`${
          disabled ? "bg-transparent" : "shadow-md dark:bg-slate-800"
        } w-full flex h-9 px-2 py-0 text-sm rounded-sm appearance-none`}
        name={name}
        ref={ref}
        onChange={onChange}
        onBlur={onBlur}
      >
        {selectOptions.map((option, i) => {
          if (!disabled) {
            return (
              <option
                className={`${
                  defaultValue === option.name ? "hidden" : ""
                } bg-slate-200 rounded-sm`}
                key={i}
              >
                {option.name}
              </option>
            );
          } else {
            return (
              <option className={`bg-slate-200 rounded-sm`} key={i}>
                {defaultValue}
              </option>
            );
          }
        })}
      </select>
      {!disabled && (
        <div className="relative pointer-events-none opacity-50">
          <div className="absolute h-5 w-5 right-2 bottom-2">
            <ArrowDownIcon />
          </div>
        </div>
      )}
    </div>
  )
);
