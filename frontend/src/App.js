import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";

import { DocumentRemoveIcon } from "@heroicons/react/outline";

import { selectLogIn, selectUser } from "./features/userBar/userBarSlice";
import {
  selectRecord,
  selectRecordStatus,
} from "./features/record/recordSlice";

import { Admin } from "./features/admin/Admin";

import { Dashboard } from "./features/dashboard/Dashboard";
import { Login } from "./features/login/Login";
import { Record } from "./features/record/Record";

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
  const record = useSelector(selectRecord);
  const recordStatus = useSelector(selectRecordStatus);

  const EmptyRecord = ({ record }) => {
    if (
      recordStatus === "creating" ||
      recordStatus === "formValidated" ||
      recordStatus === "editing"
    ) {
      return <Record />;
    }

    return (
      <div className="absolute self-center place-self-center text-slate-700 font-bold uppercase">
        <DocumentRemoveIcon className="opacity-10 w-80 h-80" />
        Ningún expediente seleccionado.
      </div>
    );
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
  });

  return (
    <Routes>
      <Route element={<ProtectedRoute isLoggedIn={useSelector(selectLogIn)} />}>
        <Route path="/" element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />}>
          <Route index element={<EmptyRecord />} />
          <Route path=":id" element={<Record record={record} />} />
        </Route>
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
