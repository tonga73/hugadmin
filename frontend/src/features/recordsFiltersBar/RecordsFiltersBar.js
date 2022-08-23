import React from "react";
import { useSelector, useDispatch } from "react-redux";

import { setRecord, selectRecordStatus } from "../record/recordSlice";
import { selectRecords } from "../records/recordsSlice";

import { XIcon, DocumentAddIcon } from "@heroicons/react/outline";

import { Button } from "../../commons/buttons/button/Button";
import { SearchInput } from "../../commons/inputs/SearchInput";

import { NewRecordButton } from "../record/buttons/NewRecordButton";

export function RecordsFiltersBar() {
  const dispatch = useDispatch();

  const recordStatus = useSelector(selectRecordStatus);
  const records = useSelector(selectRecords);

  const CreateRecordButton = ({ recordStatus }) => {
    const closeForm = () => {
      dispatch(setRecord({ status: "", record: {} }));
    };
    switch (recordStatus) {
      case "creating":
        return (
          <>
            <Button
              type="button"
              onClick={() => {
                closeForm();
              }}
              icon={<XIcon className="h-8 w-8" />}
            />
          </>
        );
      case "formValidated":
        return (
          <>
            <Button
              type="button"
              onClick={() => {
                closeForm();
              }}
              icon={<XIcon className="h-8 w-8" />}
            />
          </>
        );
      default:
        return (
          <>
            <NewRecordButton />
          </>
        );
    }
  };
  return (
    <>
      <div className="grid gap-3 px-3">
        <SearchInput />
        {CreateRecordButton({ recordStatus })}
      </div>
    </>
  );
}
