import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";

import { Counter } from "./features/counter/Counter";
import { Dashboard } from "./features/dashboard/Dashboard";
import { Login } from "./features/login/Login";

import { LoginForm } from "./features/login/forms/LoginForm";

const ProtectedRoute = ({ user, redirectPath = "/login" }) => {
  if (!user) {
    return <Navigate to={redirectPath} replace />;
  }

  return <Outlet />;
};
const PublicRoute = ({ user, redirectPath = "/" }) => {
  if (user) {
    return <Navigate to={redirectPath} replace />;
  }

  return <Outlet />;
};
function App() {
  const [user, setUser] = useState(false);
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
      <Route element={<ProtectedRoute user={user} />}>
        <Route path="/" element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
      </Route>
      <Route element={<PublicRoute user={user} />}>
        <Route path="login" element={<Login />}>
          <Route index element={<LoginForm />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
