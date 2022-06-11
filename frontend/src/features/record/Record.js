import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useForm } from "react-hook-form";

import {
  addRecord,
  getRecord,
  selectRecord,
  selectRecordStatus,
  setRecord,
} from "./recordSlice";
import { selectTracingStatus, setTracingStatus } from "../tracing/tracingSlice";

import { Tracing } from "../tracing/Tracing";

import { RecordFormSelect } from "./selectInputs/RecordFormSelect";
import { RecordFormSearch } from "./selectInputs/RecordFormSearch";
import { RecordFormInputText } from "./selectInputs/RecordFormInputText";
import { StatusSelect } from "./selectInputs/StatusSelect";

import styles from "./Record.module.css";

export function Record() {
  const dispatch = useDispatch();

  const record = useSelector(selectRecord);
  const tracingStatus = useSelector(selectTracingStatus);
  const recordStatus = useSelector(selectRecordStatus);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm();

  const onSubmit = (data) => {
    dispatch(addRecord(data));
  };

  // console.log(watch("location"));

  const selectContentType = (contentType) => {
    const contentPriority = [
      { name: "Seleccionar..." },
      { name: "Inactivo" },
      { name: "Nula" },
      { name: "Baja" },
      { name: "Media" },
      { name: "Alta" },
      { name: "Urgente" },
    ];
    const contentStatus = [
      { name: "Seleccionar..." },
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
        break;
      case "status":
        return contentStatus;
        break;

      default:
        break;
    }
  };

  const recordModeStyles = (status) => {
    switch (status) {
      case "creating":
        return styles.recordInfoCreate;
        break;

      default:
        return styles.recordInfo;
        break;
    }
  };

  function showLocation() {
    if (record.location) {
      return (
        <>
          <RecordFormSearch
            selectOptions={selectContentType("location")}
            defaultValue="629fb13d2ebca3cab4c68ff7"
            {...register("location")}
          />
        </>
      );
    }
    return;
  }

  function recordInputs() {
    return (
      <>
        <span>
          <RecordFormSelect
            disabled={recordStatus === ""}
            selectOptions={selectContentType("priority")}
            defaultValue={record.priority}
            {...register("priority")}
          />
          <RecordFormSelect
            disabled={recordStatus === ""}
            selectOptions={selectContentType("status")}
            defaultValue={record.status}
            {...register("status")}
          />
        </span>
        <RecordFormInputText
          disabled={recordStatus === ""}
          defaultValue={recordStatus === "" ? record.order : "---/---"}
          {...register("order", { required: true, minLength: 5 })}
          styles="text-3xl font-bold"
        />
        <RecordFormInputText
          disabled={recordStatus === ""}
          defaultValue={
            recordStatus === "" ? record.cover : "Nombre P/ Expediente"
          }
          {...register("cover")}
          styles="text-4xl font-thin"
        />
        {showLocation()}
      </>
    );
  }

  useEffect(() => {
    dispatch(getRecord("629fae9a12c6dd15c4acb8f9"));
    dispatch(setTracingStatus(""));
  }, [tracingStatus === "success"]);

  useEffect(() => {
    dispatch(setRecord({ status: "" }));
  }, [recordStatus === "success"]);
  return (
    <div className={styles.recordGrid}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        id="addNewRecordForm"
        className={`${recordModeStyles(recordStatus)} dark:text-slate-300`}
      >
        {recordInputs()}
      </form>
      <div className={styles.recordTracings}>
        <Tracing record={record} />
      </div>
    </div>
  );
}
