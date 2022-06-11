import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";

import {
  getRecord,
  setRecord,
  selectRecordStatus,
} from "../record/recordSlice";

import { XIcon } from "@heroicons/react/outline";

export function RecordsFiltersBar() {
  const dispatch = useDispatch();

  const recordStatus = useSelector(selectRecordStatus);

  const CreateRecordButton = ({ recordStatus }) => {
    const closeForm = () => {
      dispatch(getRecord());
      dispatch(setRecord({ status: "creating" }));
    };
    switch (recordStatus) {
      case "creating":
        return (
          <button
            onClick={() => {
              closeForm();
            }}
            type="button"
            className="border border-red-700 opacity-50 hover:opacity-100 transition-opacity"
          >
            <div className="h-10 grid justify-center items-center">
              <XIcon className="h-8 w-8 absolute-center mx-auto my-auto text-red-700" />
            </div>
          </button>
        );
        break;

      default:
        return (
          <button
            onClick={() => {
              dispatch(setRecord({ status: "creating", record: {} }));
            }}
            type="button"
            className="border opacity-50 hover:opacity-100 transition-opacity"
          >
            <div className="h-10 grid items-center">Crear Expediente</div>
          </button>
        );
        break;
    }
  };
  return (
    <>
      <div className="grid gap-3">
        <input type="search" />
        {CreateRecordButton({ recordStatus })}
      </div>
    </>
  );
}
