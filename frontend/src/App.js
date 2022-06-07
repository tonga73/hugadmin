import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import { Counter } from "./features/counter/Counter";
import { Dashboard } from "./features/dashboard/Dashboard";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<Dashboard />} />
    </Routes>
  );
}

export default App;
