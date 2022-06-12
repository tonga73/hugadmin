import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useForm } from "react-hook-form";

import { Spinner } from "../../commons/spinner/Spinner";

import {
  newRecord,
  getRecord,
  selectRecord,
  selectRecordStatus,
  setRecord,
} from "./recordSlice";
import { selectRecordsStatus } from "../records/recordsSlice";
import {
  selectTracingsStatus,
  setTracingsStatus,
} from "../tracings/tracingsSlice";
import { selectLocationsManager } from "../locationsManager/locationsManagerSlice";

import { Tracings } from "../tracings/Tracings";

import { RecordFormSelect } from "./selectInputs/RecordFormSelect";
import { RecordFormInputText } from "./selectInputs/RecordFormInputText";

import styles from "./Record.module.css";

export function Record() {
  const dispatch = useDispatch();

  const record = useSelector(selectRecord);
  const recordStatus = useSelector(selectRecordStatus);
  const recordsStatus = useSelector(selectRecordsStatus);
  const tracingsStatus = useSelector(selectTracingsStatus);
  const locations = useSelector(selectLocationsManager);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm();

  const onSubmit = (data) => {
    dispatch(newRecord(data));
  };

  // console.log(watch("location"));

  const selectContentType = (contentType) => {
    const contentPriority = [
      { name: "Nula" },
      { name: "Baja" },
      { name: "Media" },
      { name: "Alta" },
      { name: "Urgente" },
      { name: "Inactivo" },
    ];
    const contentStatus = [
      { name: "Acepta cargo" },
      { name: "Acto pericial realizado" },
      { name: "Pericia realizada" },
      { name: "Sentencia o convenio de partes" },
      { name: "Honorarios regulados" },
      { name: "En tratativa de cobro" },
      { name: "Cobrado" },
    ];
    switch (contentType) {
      case "priority":
        return contentPriority;

      case "status":
        return contentStatus;

      case "location":
        return locations;

      default:
        break;
    }
  };

  const recordModeStyles = (status) => {
    switch (status) {
      case "creating":
        return styles.recordInfoCreate;

      default:
        return styles.recordInfo;
    }
  };

  function showLocation() {
    // if (record.location) {
    //   return (
    //     <>
    //       <RecordFormSelect
    //         disabled={recordStatus === ""}
    //         selectOptions={selectContentType("location")}
    //         defaultValue={locations[0].name}
    //         {...register("location")}
    //       />
    //     </>
    //   );
    // }
    return;
  }

  function recordInputs(record) {
    return (
      <>
        <span>
          <RecordFormSelect
            disabled={recordStatus === ""}
            selectOptions={selectContentType("priority")}
            defaultValue={record.priority}
            {...register("priority")}
            styles={
              recordStatus === ""
                ? "bg-gradient-to-r from-stone-900 via-transparent"
                : ""
            }
          />
          <RecordFormSelect
            disabled={recordStatus === ""}
            selectOptions={selectContentType("status")}
            defaultValue={record.status}
            {...register("status", { required: true, minLength: 5 })}
            styles={recordStatus === "" ? "bg-stone-900 text-right" : ""}
          />
        </span>
        <RecordFormInputText
          disabled={recordStatus === ""}
          defaultValue={recordStatus === "" ? record.order : ""}
          {...register("order", { required: true, minLength: 5 })}
          styles="text-3xl font-bold"
          placeHolder={recordStatus === "editing" ? record.order : ""}
        />
        <RecordFormInputText
          disabled={recordStatus === ""}
          defaultValue={recordStatus === "" ? record.cover : ""}
          {...register("cover", { required: true, minLength: 5 })}
          styles="text-4xl font-thin"
          placeHolder={recordStatus === "editing" ? record.cover : ""}
        />
        {showLocation()}
      </>
    );
  }

  useEffect(() => {
    if (record !== undefined) {
      dispatch(getRecord(record._id));
    }
  }, [recordsStatus]);

  return (
    <>
      {recordStatus == "loading" && (
        <div className="flex justify-center items-center w-full">
          <Spinner />
        </div>
      )}
      {recordStatus !== "loading" && (
        <div className={styles.recordGrid}>
          <form
            onSubmit={handleSubmit(onSubmit)}
            id="addNewRecordForm"
            className={`${recordModeStyles(recordStatus)} dark:text-slate-300`}
          >
            {recordInputs(record)}
          </form>
          <div className={styles.recordTracings}>
            <Tracings record={record} />
          </div>
        </div>
      )}
    </>
  );
}
