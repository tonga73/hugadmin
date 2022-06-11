import React from "react";

import { Tooltip } from "../../tooltip/Tooltip";

import { PaperClipIcon } from "@heroicons/react/solid";

export function ClipboardButton({ value }) {
  return (
    <>
      <div className="relative">
        <button
          className="absolute p-0.5 bottom-0 right-0 bg-blue-700 opacity-30 hover:opacity-100 hover:translate-y-1 transition-all duration-75"
          onClick={() => navigator.clipboard.writeText(value)}
        >
          <Tooltip message={value}>
            <PaperClipIcon className="h-4 w-4" />
          </Tooltip>
        </button>
      </div>
    </>
  );
}
