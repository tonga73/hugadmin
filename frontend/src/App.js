import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";

import { loginStatus } from "./features/userBar/userBarSlice";

import { Dashboard } from "./features/dashboard/Dashboard";
import { Login } from "./features/login/Login";

import { LoginForm } from "./features/login/forms/LoginForm";

const ProtectedRoute = ({ user, redirectPath = "/login" }) => {
  if (user) {
    return <Outlet />;
  }

  return <Navigate to={redirectPath} replace />;
};

const PublicRoute = ({ user, redirectPath = "/" }) => {
  if (!user) {
    return <Outlet />;
  }

  return <Navigate to={redirectPath} replace />;
};

function App() {
  const defaultLogInValue = {
    isLoggedIn: false,
  };

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
      <Route element={<ProtectedRoute user={useSelector(loginStatus)} />}>
        <Route path="/" element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="*" exact={true} element={<Login />} />
      </Route>
      <Route element={<PublicRoute user={useSelector(loginStatus)} />}>
        <Route path="login" element={<Login />}>
          <Route index element={<LoginForm />} />
          <Route path="*" exact={true} element={<Login />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
