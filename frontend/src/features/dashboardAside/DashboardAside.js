import React from "react";

import { Records } from "../records/Records";
import { UserSettings } from "../userSettings/UserSettings";
import { RecordsFiltersBar } from "../recordsFiltersBar/RecordsFiltersBar";

export function DashboardAside(props) {
  const mode = props.mode;
  if (mode === "settings-menu") {
    return <UserSettings />;
  }
  return (
    <div className="px-5 py-3">
      <RecordsFiltersBar />
      <Records />
    </div>
  );
}
