import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";

import { Transition } from "@headlessui/react";

import { getRecords, selectRecords, selectRecordsStatus } from "./recordsSlice";
import { getRecord, selectRecord } from "../record/recordSlice";

import { Spinner } from "../../commons/spinner/Spinner";

import { RecordsFiltersBar } from "../recordsFiltersBar/RecordsFiltersBar";
import { getLocations } from "../locationsManager/locationsManagerSlice";

export function Records() {
  const isShowing = true;

  const dispatch = useDispatch();

  const allRecords = useSelector(selectRecords);
  const recordsStatus = useSelector(selectRecordsStatus);
  const activeRecord = useSelector(selectRecord);

  const setActiveRecord = (record) => {
    record !== activeRecord && dispatch(getRecord(record._id));
  };

  const ListRecords = ({ records }) => {
    return records.map((record) => (
      <div
        onClick={() => setActiveRecord(record)}
        className={`grid grid-rows-3 my-3 rounded-tl-xl dark:bg-slate-800 shadow-sm dark:shadow-slate-700 text-md select-none hover:cursor-pointer hover:scale-105 transition-transform ${
          record === activeRecord ? "" : ""
        }`}
        key={record._id}
      >
        <div className="grid grid-cols-7 pl-2.5">
          <span className="absolute">
            <span className="flex h-3 w-3  relative right-3.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
            </span>
          </span>
          <span className="col-span-3 text-left text-lg tracking-wider">
            {record.order}
          </span>
          <span className="col-span-4 text-right bg-stone-900 px-2 py-0.5 truncate">
            {record.status}
          </span>
        </div>
        <span className="row-span-2 flex items-center px-2 text-lg font-semibold truncate bg-slate-900">
          {record.cover}
        </span>
      </div>
    ));
  };

  return (
    <div className="h-full text-center py-8 px-5">
      <RecordsFiltersBar records={allRecords} />

      {recordsStatus === "loading" && (
        <div className="py-36">
          <Spinner />
        </div>
      )}
      {recordsStatus !== "loading" && (
        <Transition
          show={isShowing}
          enter="transition-opacity duration-1000"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity duration-1000"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          {ListRecords({ records: allRecords })}
        </Transition>
      )}
    </div>
  );
}
