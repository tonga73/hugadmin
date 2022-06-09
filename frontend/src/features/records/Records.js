import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";

import { Transition } from "@headlessui/react";

import { getRecords, selectRecords } from "./recordsSlice";
import { selectUser } from "../userBar/userBarSlice";

import { RecordsFiltersBar } from "../recordsFiltersBar/RecordsFiltersBar";

export function Records() {
  const dispatch = useDispatch();

  const isShowing = true;

  const allRecords = useSelector(selectRecords);

  const ListRecords = ({ records }) => {
    return records.map((record) => (
      <div
        className="py-3 grid grid-flow-col my-3 shadow-lg shadow-slate-700 border-t border-t-slate-700 text-md"
        key={record._id}
      >
        <span>{record.order} |</span>
        <span> {record.cover}</span>
      </div>
    ));
  };

  useEffect(() => {
    dispatch(getRecords());
  }, [dispatch]);

  return (
    <Transition
      className="h-full text-center py-8 px-5"
      appear={true}
      show={isShowing}
      enter="transition-opacity duration-1000"
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="transition-opacity duration-1000"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <RecordsFiltersBar records={allRecords} />
      {ListRecords({ records: allRecords })}
    </Transition>
  );
}
