import React from "react";

export function Alert({
  text,
  success,
  error,
  duration,
  icon,
  dense,
  styles,
}: {
  icon: ReactNode,
}) {
  return (
    <div
      className={`${
        success === true ? "bg-green-700" : error === true ? "bg-red-700" : ""
      } grid grid-flow-col items-center rounded-s mb-1.5 ${
        dense ? "py-0 px-0" : "py-1 px-1.5"
      } ${styles} ${!success && !error ? "bg-blue-700" : ""}`}
    >
      <div
        className={`${success && "bg-green-700 text-slate-200"} ${
          error && "bg-red-700 text-slate-400"
        } flex justify-center ${dense ? "py-0" : "py-1"} ${styles} ${
          !success && !error ? "text-white" : ""
        }`}
      >
        {icon}
      </div>
      <div
        className={`${success && "bg-green-700 text-slate-200"} ${
          error && "bg-red-700 text-slate-400"
        } col-span-12 tracking-tight font-bold uppercase ${
          dense ? "py-0" : "py-1"
        } ${styles} ${!success && !error ? "text-white" : ""}`}
      >
        {text}
      </div>
    </div>
  );
}
