import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useForm } from "react-hook-form";
import { useParams, useSearchParams } from "react-router-dom";

import { Spinner } from "../../commons/spinner/Spinner";
import { statusColorPicker } from "../../commons/helpers/statusColorPicker";
import { priorityColorPicker } from "../../commons/helpers/priorityColorPicker";

import { DocumentRemoveIcon } from "@heroicons/react/outline";

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

  const [query, setQuery] = useSearchParams();

  const recordId = query.get("id");

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm();

  const validateForm = () => {
    let orderValidation = watch("order");
    let coverValidation = watch("cover");

    if (orderValidation === undefined || coverValidation === undefined) {
      return;
    }

    if (orderValidation.length > 5 && coverValidation.length > 7) {
      return true;
    }
  };

  const validate = validateForm();

  const setRequired = () => {
    if (recordStatus !== "editing") {
      return true;
    } else {
      return false;
    }
  };

  const onSubmit = (data) => {
    dispatch(newRecord(data));
  };

  // console.log(watch("location"));

  const showRecord = () => {
    if (recordStatus === "loading") {
      return (
        <div className="flex justify-center items-center w-full">
          <Spinner />
        </div>
      );
    } else if (
      recordStatus === "creating" ||
      recordStatus === "formValidated" ||
      recordStatus === "editing" ||
      (recordStatus === "" && record !== undefined)
    ) {
      return (
        <>
          <form
            onSubmit={handleSubmit(onSubmit)}
            id="addNewRecordForm"
            className={`${recordModeStyles(
              recordStatus
            )} dark:text-slate-300 dark:bg-slate-700 dark:bg-opacity-50 py-1.5 px-3 rounded-sm`}
          >
            {recordInputs(record || {})}
          </form>
          <div className={styles.recordTracings}>
            <Tracings record={record} />
          </div>
        </>
      );
    }
  };

  const EmptyRecord = ({ record }) => {
    if (
      recordStatus === "creating" ||
      recordStatus === "formValidated" ||
      recordStatus === "editing"
    ) {
      return <Record />;
    }

    return (
      <div className="absolute self-center place-self-center text-slate-700 font-bold uppercase">
        <DocumentRemoveIcon className="opacity-10 w-80 h-80" />
        Ningún expediente seleccionado.
      </div>
    );
  };

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
    if (record.location) {
      return (
        <>
          <RecordFormSelect
            disabled={recordStatus === ""}
            selectOptions={selectContentType("location")}
            defaultValue={locations[0].name}
            {...register("location")}
          />
        </>
      );
    }
    return (
      <RecordFormSelect
        disabled={recordStatus === ""}
        selectOptions={selectContentType("location")}
        defaultValue="olas"
        {...register("location")}
      />
    );
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
            styles={`${
              recordStatus === ""
                ? priorityColorPicker({
                    priority: record.priority,
                    style: "gradient",
                  })
                : ""
            } bg-gradient-to-r via-transparent font-bold dark:text-slate-200`}
          />
          <RecordFormSelect
            disabled={recordStatus === ""}
            selectOptions={selectContentType("status")}
            defaultValue={record.status}
            {...register("status")}
            styles={
              recordStatus === ""
                ? `${statusColorPicker({
                    status: record.status,
                  })} text-right font-bold`
                : ""
            }
          />
        </span>
        <RecordFormInputText
          disabled={recordStatus === ""}
          defaultValue={recordStatus === "" || "editng" ? record.order : ""}
          styles="text-3xl font-bold"
          placeHolder={recordStatus === "editing" ? record.order : "1234/4321"}
          {...register("order", { required: setRequired(), minLength: 5 })}
        />
        {errors.order && recordStatus === "creating" && (
          <span className="px-3 flex items-center opacity-70 bg-red-700  text-slate-400 tracking-tight font-bold uppercase">
            <small>Es requerido indicar un</small> orden.
          </span>
        )}

        <RecordFormInputText
          disabled={recordStatus === ""}
          defaultValue={recordStatus === "" || "editng" ? record.cover : ""}
          styles="text-4xl font-thin"
          placeHolder={
            recordStatus === "editing"
              ? record.cover
              : "Una Carátula P/ Expediente"
          }
          {...register("cover", { required: setRequired(), minLength: 5 })}
        />
        {errors.cover && recordStatus === "creating" && (
          <span className="px-3 flex items-center opacity-70 bg-red-700  text-slate-400 tracking-tight font-bold uppercase">
            <small>Es requerido indicar una</small> carátula.
          </span>
        )}

        {showLocation()}
      </>
    );
  }

  useEffect(() => {
    dispatch(getRecord(recordId));
  }, [recordId]);

  useEffect(() => {
    reset();
  }, [recordStatus === ""]);

  useEffect(() => {
    if (
      recordStatus === "creating" &&
      validate !== undefined &&
      validate === true
    ) {
      dispatch(setRecord({ status: "formValidated" }));
    }
  }, [validate === true]);

  return showRecord();
}
