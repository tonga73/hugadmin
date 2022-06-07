import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import { Counter } from "./features/counter/Counter";
import { Dashboard } from "./features/dashboard/Dashboard";

function App() {
  useEffect(() => {
    // On page load or when changing themes, best to add inline in `head` to avoid FOUC
    if (
      localStorage.theme === "dark" ||
      (!("theme" in localStorage) &&
        window.matchMedia("(prefers-color-scheme: dark)").matches)
    ) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [localStorage.theme]);

  return (
    <Routes>
      <Route path="/" element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<Dashboard />} />
    </Routes>
  );
}

export default App;
