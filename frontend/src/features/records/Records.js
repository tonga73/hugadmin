import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";

import { Transition } from "@headlessui/react";

import { getRecords, records } from "./recordsSlice";
import { selectUser } from "../userBar/userBarSlice";

import { RecordsFiltersBar } from "../recordsFiltersBar/RecordsFiltersBar";

export function Records() {
  const dispatch = useDispatch();

  const isShowing = true;

  const { token } = useSelector(selectUser);
  const allRecords = useSelector(records);

  const ListRecords = ({ records }) => {
    return records.map((record) => <div key={record._id}>{record.cover}</div>);
  };

  useEffect(() => {
    dispatch(getRecords(token));
  }, [dispatch, token]);

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
      Records aqui
      {ListRecords({ records: allRecords })}
      {/* <ListRecords records={allRecords} /> */}
    </Transition>
  );
}
