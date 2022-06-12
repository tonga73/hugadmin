import React from "react";
import { useSelector, useDispatch } from "react-redux";

import { setRecord, selectRecordStatus } from "../record/recordSlice";
import { selectRecords } from "../records/recordsSlice";

import { XIcon } from "@heroicons/react/outline";

export function RecordsFiltersBar() {
  const dispatch = useDispatch();

  const recordStatus = useSelector(selectRecordStatus);
  const records = useSelector(selectRecords);

  const CreateRecordButton = ({ recordStatus }) => {
    const closeForm = () => {
      dispatch(setRecord({ status: "", record: records[0] }));
    };
    switch (recordStatus) {
      case "creating":
        return (
          <button
            onClick={() => {
              closeForm();
            }}
            type="button"
            className="border dark:text-slate-600 border-slate-600 opacity-50 hover:opacity-100 transition-opacity"
          >
            <div className="h-10 grid justify-center items-center">
              <XIcon className="h-8 w-8 absolute-center mx-auto my-auto text-slate-700" />
            </div>
          </button>
        );

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
