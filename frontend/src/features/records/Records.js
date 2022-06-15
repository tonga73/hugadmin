import React from "react";
import { useSelector, useDispatch } from "react-redux";

import { Transition } from "@headlessui/react";
import { DocumentAddIcon } from "@heroicons/react/outline";

import { selectRecords, selectRecordsStatus } from "./recordsSlice";
import {
  getRecord,
  selectRecord,
  selectRecordStatus,
} from "../record/recordSlice";

import { Spinner } from "../../commons/spinner/Spinner";

import { RecordsFiltersBar } from "../recordsFiltersBar/RecordsFiltersBar";

export function Records() {
  const isShowing = true;

  const dispatch = useDispatch();

  const records = useSelector(selectRecords);
  const recordsStatus = useSelector(selectRecordsStatus);
  const activeRecord = JSON.parse(localStorage.getItem("state")).record.record;
  const recordStatus = useSelector(selectRecordStatus);

  const setActiveRecord = (record) => {
    record !== activeRecord && dispatch(getRecord(record._id));
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
        <div
          onClick={() => setActiveRecord(record)}
          className={`grid grid-rows-3 rounded-tl-xl h-20 dark:bg-slate-800 shadow-sm dark:shadow-slate-700 text-md select-none hover:cursor-pointer hover:scale-105 transition-transform ${
            record === activeRecord ? "" : ""
          }`}
          key={record._id}
        >
          <div className="grid grid-cols-7 pl-2.5">
            <span className="relative -left-5 w-5 col-span-7 bg-pink-300">
              <div className="absolute right-0">
                <span className="flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                </span>
              </div>
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
    }
  };

  return (
    <div className="h-screen text-center py-8">
      <RecordsFiltersBar records={records} />

      {recordsStatus === "loading" && (
        <div className="py-36">
          <Spinner />
        </div>
      )}
      {recordsStatus !== "loading" && (
        <Transition
          className={`${
            recordStatus === "creating" || recordStatus === "formValidated"
              ? "opacity-10 transition-opacity pointer-events-none"
              : ""
          } h-full `}
          appear={true}
          show={isShowing}
        >
          <Transition.Child
            enter="transition-opacity duration-1000"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity duration-1000"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
            className="h-full overflow-scroll px-3 flex flex-col gap-y-3 pb-36 pt-3"
          >
            {ListRecords({ records: records })}
          </Transition.Child>
        </Transition>
      )}
    </div>
  );
}
