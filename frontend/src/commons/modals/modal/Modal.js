import React from "react";

export function Modal({
  active,
  content,
  styles,
}: {
  active: string,
  content: ReactNode,
  styles: string,
}) {
  return (
    active && (
      <div className="fixed top-0 left-0 h-full w-full flex justify-center items-center dark:bg-slate-900 dark:bg-opacity-90">
        {content}
      </div>
    )
  );
}
