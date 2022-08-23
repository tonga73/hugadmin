import React from "react";

export function Button({
  type,
  text,
  icon,
  dense,
  styles,
  onClick,
}: {
  type: string,
  text: string,
  icon: ReactNode,
  dense: boolean,
  styles: string,
}) {
  return (
    <button
      className={`h-10 grid grid-flow-col justify-center gap-3 items-center border opacity-50 hover:opacity-100 transition-opacity dark:text-slate-200 text-xl font-semibold ${
        dense ? "py-0" : "py-1 px-1"
      } ${styles}`}
      onClick={onClick}
      type={type}
    >
      {icon && <div>{icon}</div>}
      <div>{text}</div>
    </button>
  );
}
