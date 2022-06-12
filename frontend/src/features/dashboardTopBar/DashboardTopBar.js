import React from "react";
import { useSelector, useDispatch } from "react-redux";

import {
  ArrowsExpandIcon,
  BackspaceIcon,
  ArrowLeftIcon,
  SaveIcon,
  PencilIcon,
  TrashIcon,
  ArchiveIcon,
  XIcon,
} from "@heroicons/react/outline";

import {
  setRecord,
  selectRecordStatus,
  editRecord,
} from "../record/recordSlice";
import { setRecords, getRecords } from "../records/recordsSlice";

import styles from "./DashboardTopBar.module.css";

export function DashboardTopBar(props) {
  const dispatch = useDispatch();
  const onClick = props.onClick;
  const mode = props.mode;
  const recordStatus = useSelector(selectRecordStatus);

  function FullscreenToggleIcon() {
    if (mode === "full-screen") {
      return (
        <ArrowLeftIcon
          onClick={onClick}
          className="h-6 w-6 opacity-50 hover:opacity-100"
          aria-hidden="true"
        />
      );
    }
    return (
      <ArrowsExpandIcon
        onClick={onClick}
        className="h-6 w-6 opacity-50 hover:opacity-100"
        aria-hidden="true"
      />
    );
  }
  return (
    <nav
      className={`${styles.dashboardTopBar} ${
        mode === "full-screen" ? "py-1" : ""
      }`}
    >
      <div className="col-span-6 grid grid-flow-col gap-1.5 justify-start">
        {recordStatus === "" && (
          <button
            onClick={() => {
              dispatch(setRecord({ status: "editing" }));
            }}
            type="button"
            form=""
            className={`inline-flex items-center gap-x-1.5 px-3 py-1 rounded-sm text-slate-200 border border-slate-500 opacity-50 hover:opacity-100 transition-opacity`}
          >
            Editar
            <PencilIcon className="h-5 w-5" />
          </button>
        )}
        <button
          type="submit"
          form="addNewRecordForm"
          className={`${
            recordStatus === "" || recordStatus === "editing"
              ? "hidden"
              : recordStatus === "creating"
              ? "opacity-10 cursor-default pointer-events-none inline-flex items-center gap-x-1.5 px-3 py-1 rounded-sm bg-green-800"
              : recordStatus === "formValidated"
              ? "hover:-translate-y-1 inline-flex items-center gap-x-1.5 px-3 py-1 rounded-sm transition-transform text-slate-200 bg-green-800"
              : ""
          } `}
        >
          Guardar
          <SaveIcon className="h-5 w-5" />
        </button>
        {recordStatus === "editing" && (
          <>
            <button
              type="submit"
              form="addNewRecordForm"
              className={`inline-flex items-center gap-x-1.5 px-3 py-1 rounded-sm hover:-translate-y-1 transition-transform text-slate-200 bg-orange-800 opacity-30`}
            >
              Editar
              <SaveIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => {
                dispatch(setRecord({ status: "" }));
              }}
              type="button"
              className={`inline-flex items-center gap-x-1.5 px-3 py-1 rounded-sm text-slate-200 dark:text-slate-600 border-slate-600 border opacity-50  hover:opacity-100 transition-opacity`}
            >
              Cancelar
              <XIcon className="h-5 w-5" />
            </button>
          </>
        )}
      </div>
      <div className="col-span-6 grid grid-flow-col gap-1.5 justify-end">
        {recordStatus === "" && (
          <>
            <button
              type="submit"
              form=""
              className={`inline-flex items-center gap-x-1.5 px-3 py-1 rounded-sm text-slate-200 border border-slate-500 opacity-50 hover:text-white hover:bg-red-700 hover:border-opacity-0 hover:opacity-100 transition-opacity`}
            >
              Elminar
              <TrashIcon className="h-5 w-5" />
            </button>
            <button
              type="submit"
              form=""
              className={`inline-flex items-center gap-x-1.5 px-3 py-1 rounded-sm text-slate-200 border border-slate-500 opacity-50 hover:text-neutral-900 hover:bg-gray-400 hover:border-opacity-0 hover:opacity-100 transition-opacity`}
            >
              Archivar
              <ArchiveIcon className="h-5 w-5" />
            </button>
          </>
        )}
        <span className="flex items-center text-slate-700">{" | "}</span>
        <button type="button">
          <FullscreenToggleIcon />
        </button>
      </div>
    </nav>
  );
}
