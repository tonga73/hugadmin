import React, { Fragment, useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link, useParams, useSearchParams } from "react-router-dom";

import { Transition } from "@headlessui/react";
import { DocumentAddIcon } from "@heroicons/react/outline";

import { selectRecords, selectRecordsStatus } from "./recordsSlice";
import {
  getRecord,
  selectRecord,
  selectRecordStatus,
} from "../record/recordSlice";

import { Spinner } from "../../commons/spinner/Spinner";
import { statusColorPicker } from "../../commons/helpers/statusColorPicker";
import { priorityColorPicker } from "../../commons/helpers/priorityColorPicker";

import { RecordsFiltersBar } from "../recordsFiltersBar/RecordsFiltersBar";

export function Records() {
  const isShowing = true;

  const dispatch = useDispatch();

  const params = useParams();

  const [query, setQuery] = useSearchParams();

  const records = useSelector(selectRecords);
  const recordsStatus = useSelector(selectRecordsStatus);
  const activeRecord = query.get("id");
  const recordStatus = useSelector(selectRecordStatus);

  const setActiveRecord = (record) => {
    record._id !== activeRecord && dispatch(getRecord(record._id));
  };

  const RecordItem = ({ record, activeRecord }) => {
    return (
      <>
        <div className="grid grid-cols-7 pl-2.5">
          <span className="relative -left-5 w-5 col-span-7 bg-pink-300">
            <div className="absolute right-0">
              <span className="flex h-3 w-3">
                <span
                  className={`${priorityColorPicker({
                    priority: record.priority,
                    style: "badge",
                  })} absolute inline-flex h-full w-full rounded-full opacity-75`}
                ></span>
                <span
                  className={`${priorityColorPicker({
                    priority: record.priority,
                    style: "badge",
                  })} relative inline-flex rounded-full h-3 w-3`}
                ></span>
              </span>
            </div>
          </span>
          <span className="col-span-3 text-left text-lg tracking-wider">
            {record.order}
          </span>
          <span
            className={`${
              record.status ? statusColorPicker({ status: record.status }) : ""
            } col-span-4 text-right text-sm self-center px-2 py-0.5 truncate font-bold uppercase`}
          >
            {record.status}
          </span>
        </div>
        <span className="row-span-2 flex w-full justify-end items-center px-2 text-lg font-semibold truncate bg-slate-900">
          {record.cover}
          {record._id === activeRecord && (
            <div className="relative h-5 w-5 dark:bg-slate-600 dark:bg-opacity-60 -right-5 rotate-45">
              <div className="absolute"></div>
            </div>
          )}
        </span>
      </>
    );
  };

  const ListRecords = ({ records }) => {
    if (records.length <= 0) {
      return (
        <div className="uppercase dark:text-slate-700 font-bold pt-32">
          <DocumentAddIcon className="w-28 h-28 m-auto" />
          No se encontraron expedientes.
        </div>
      );
    } else {
      return records.map((record) => (
        <button
          onClick={() => setQuery({ id: record._id })}
          className={`grid grid-rows-3 rounded-tl-xl h-20 dark:bg-slate-800 text-md select-none transition-transform ${
            record._id === activeRecord
              ? "scale-105 cursor-default shadow-sm dark:shadow-slate-800"
              : "opacity-30 hover:scale-105 hover:cursor-pointer"
          }`}
          key={record._id}
        >
          {RecordItem({ record, activeRecord })}
        </button>
      ));
    }
  };

  return (
    <div className="h-screen text-center">
      <RecordsFiltersBar records={records} />

      {recordsStatus === "loading" && (
        <div className="py-36">
          <Spinner />
        </div>
      )}
      {recordsStatus !== "loading" && (
        <div
          className={`${
            recordStatus === "creating" || recordStatus === "formValidated"
              ? "opacity-10 transition-opacity pointer-events-none"
              : ""
          } h-full overflow-scroll px-3 flex flex-col gap-y-3 pb-44 pt-3 `}
        >
          {ListRecords({ records: records })}
        </div>
      )}
    </div>
  );
}
