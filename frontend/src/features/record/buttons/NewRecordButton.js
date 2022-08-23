import React from "react";
import { useSelector, useDispatch } from "react-redux";

import { DocumentAddIcon } from "@heroicons/react/outline";

import { Button } from "../../../commons/buttons/button/Button";

import { setRecord } from "../recordSlice";
import { setRecords } from "../../records/recordsSlice";

export function NewRecordButton() {
  const dispatch = useDispatch();
  return (
    <Button
      type="button"
      onClick={() => {
        dispatch(
          setRecord({
            status: "creating",
          })
        );
      }}
      text="Crear Expediente"
      icon={<DocumentAddIcon className="h-7 w-7" />}
    />
  );
}
