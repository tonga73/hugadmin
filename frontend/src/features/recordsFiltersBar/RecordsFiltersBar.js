import React from "react";
import { useSelector, useDispatch } from "react-redux";

import { setRecord, selectRecordStatus } from "../record/recordSlice";
import { selectRecords } from "../records/recordsSlice";

import { XIcon, DocumentAddIcon } from "@heroicons/react/outline";

import { Button } from "../../commons/buttons/button/Button";
import { SearchInput } from "../../commons/inputs/SearchInput";

export function RecordsFiltersBar() {
  const dispatch = useDispatch();

  const recordStatus = useSelector(selectRecordStatus);
  const records = useSelector(selectRecords);

  const CreateRecordButton = ({ recordStatus }) => {
    const closeForm = () => {
      dispatch(setRecord({ status: "" }));
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
            <Button
              type="button"
              onClick={() => {
                dispatch(
                  setRecord({
                    status: "creating",
                    record: { order: "", cover: "" },
                  })
                );
              }}
              text="Crear Expediente"
              icon={<DocumentAddIcon className="h-7 w-7" />}
            />
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
