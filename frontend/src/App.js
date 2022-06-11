import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";

import { selectLogIn, selectUser } from "./features/userBar/userBarSlice";

import { Admin } from "./features/admin/Admin";

import { Dashboard } from "./features/dashboard/Dashboard";
import { Login } from "./features/login/Login";

import { LoginForm } from "./features/login/forms/LoginForm";

const ProtectedRoute = ({ isLoggedIn, redirectPath = "/login" }) => {
  if (isLoggedIn) {
    return <Outlet />;
  }

  return <Navigate to={redirectPath} replace />;
};

const PublicRoute = ({ isLoggedIn, redirectPath = "/" }) => {
  if (!isLoggedIn) {
    return <Outlet />;
  }

  return <Navigate to={redirectPath} replace />;
};

const AdminRoute = ({ user, redirectPath = "/" }) => {
  if (user.role === "admin") {
    return <Outlet />;
  }

  return <Navigate to={redirectPath} replace />;
};

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
  });

  return (
    <Routes>
      <Route element={<ProtectedRoute isLoggedIn={useSelector(selectLogIn)} />}>
        <Route path="/" element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="*" exact={true} element={<Login />} />
        <Route element={<AdminRoute user={useSelector(selectUser)} />}>
          <Route path="admin" element={<Navigate to="admin-panel" replace />} />
          <Route path="admin-panel" element={<Admin />} />
          <Route path="*" exact={true} element={<Login />} />
        </Route>
      </Route>
      <Route element={<PublicRoute isLoggedIn={useSelector(selectLogIn)} />}>
        <Route path="login" element={<Login />}>
          <Route index element={<LoginForm />} />
          <Route path="*" exact={true} element={<Login />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
