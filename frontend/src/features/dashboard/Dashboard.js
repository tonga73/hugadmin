import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Outlet } from "react-router-dom";

import { delay } from "../../app/helpers/delay";

import { XIcon, ExclamationIcon } from "@heroicons/react/outline";

import { Modal } from "../../commons/modals/modal/Modal";
import { Button } from "../../commons/buttons/button/Button";

import { DashboardAside } from "../dashboardAside/DashboardAside";
import { DashboardTopBar } from "../dashboardTopBar/DashboardTopBar";
import { Record } from "../record/Record";

import {
  setUser,
  selectToken,
  selectUserStatus,
} from "../userBar/userBarSlice";
import {
  getRecord,
  selectRecord,
  setRecord,
  selectRecordStatus,
  removeRecord,
} from "../record/recordSlice";
import { getRecords, selectRecords, setRecords } from "../records/recordsSlice";

import styles from "./Dashboard.module.css";

export function Dashboard() {
  const dispatch = useDispatch();

  const userStatus = useSelector(selectUserStatus);
  const record = JSON.parse(localStorage.getItem("state")).record.record;
  const records = JSON.parse(localStorage.getItem("state")).records.records;
  const recordStatus = useSelector(selectRecordStatus);
  const token = useSelector(selectToken);

  const [mode, setMode] = useState("list-records");
  const [recordsMode, setRecordsMode] = useState("");
  const [isShowing, setIsShowing] = useState(false);

  function toggleSettings() {
    if (mode === "settings-menu") {
      setMode("list-records");
    }
    if (mode === "list-records") {
      setMode("settings-menu");
    }
  }

  function toggleFullScreen() {
    if (mode === "full-screen") {
      setMode("list-records");
    }
    if (mode === "list-records") {
      setMode("full-screen");
    }
  }

  const ConfirmRemoveRecord = () => {
    return (
      <div className="grid grid-cols-5 w-1/3 h-52 items-center dark:bg-slate-900 dark:text-slate-200 shadow-md shadow-red-800">
        <div className="col-span-5 grid grid-cols-12 px-3 py-1 items-center uppercase font-bold bg-red-800">
          <div className="col-span-11 inline-flex gap-1 items-center">
            <ExclamationIcon className="h-7 w-7" />
            Elminando Expediente
          </div>
          <button
            onClick={() => {
              dispatch(setRecord({ status: "" }));
            }}
            className="col-span-1 col-start-13"
          >
            <XIcon className="h-7 w-7" />
          </button>
        </div>
        <div className="col-span-5 p-3 rounded-sm">
          <div className="text-slate-500">
            El expediente: <br />
            <strong className="uppercase py-1 block text-lg text-center dark:text-slate-200">
              {record.order} | {record.cover}
            </strong>
            será{" "}
            <span className="font-semibold bg-red-800 dark:text-slate-200 p-0.5 rounded-sm">
              ELIMINADO DEFINITIVAMENTE
            </span>
            .
          </div>
        </div>
        <div className="col-span-5 py-1 px-3 inline-flex justify-between">
          <Button
            onClick={() => {
              dispatch(removeRecord(record));
            }}
            text="Eliminar"
            styles="border-red-600 text-red-600 hover:text-slate-200 hover:bg-red-700"
          />
          <Button
            onClick={() => {
              dispatch(setRecord({ status: "" }));
            }}
            text="Cancelar"
            styles="border-slate-100 text-slate-100"
          />
        </div>
      </div>
    );
  };

  useEffect(() => {
    dispatch(setUser({ status: "" }));
    dispatch(getRecords());
    delay(1500).then((res) => {
      dispatch(setRecords({ status: "" }));
    });
  }, [token, recordStatus === "removeSuccess"]);

  return (
    <div className={styles.dashboardBackgroundContainer}>
      <div
        className={`${
          mode !== "full-screen"
            ? styles.dashboardGrid
            : styles.dashboardGridFullscreen
        } dark:bg-slate-900`}
      >
        <DashboardAside onClick={toggleSettings} mode={mode} />
        <div
          className={`${
            mode !== "full-screen"
              ? styles.dashboard
              : styles.dashboardFullscreen
          } dark:bg-slate-800 dark:bg-opacity-60 dark:shadow-slate-700`}
        >
          <DashboardTopBar onClick={toggleFullScreen} mode={mode} />

          <div className="h-full grid grid-cols-3 gap-3 overflow-hidden p-3">
            <Outlet />
          </div>
        </div>
      </div>
      <Modal
        active={recordStatus === "removeConfirm"}
        content={<ConfirmRemoveRecord />}
      />
    </div>
  );
}
