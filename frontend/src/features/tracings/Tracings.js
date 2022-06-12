import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";

import { selectTracings, addTracing, removeTracing } from "./tracingsSlice";

import {
  PlusIcon,
  XIcon,
  SaveIcon,
  TrashIcon,
  ArchiveIcon,
} from "@heroicons/react/solid";

import styles from "./Tracings.module.css";

export function Tracings(props) {
  const dispatch = useDispatch();
  const [mode, setMode] = useState("");
  const tracings = useSelector(selectTracings);

  const record = props.record;

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm();

  const createTracing = () => {
    const mode = "creating";
    setMode(mode);
    addNewTracing({ mode: mode, comment: "" });
  };
  const addNewTracing = ({ mode, comment }) => {
    const tracing = { comment, record };
    switch (mode && comment) {
      case "creating" && "":
        return;
      case "success" && comment:
        dispatch(addTracing(tracing));
        setMode(mode);
        reset();
        break;
      default:
        return;
    }
  };

  function closeForm() {
    setMode("");
    reset();
  }

  const onSubmit = (data) => addNewTracing({ mode: "success", comment: data });

  const addTracingButton = ({ styles }) => {
    return (
      <>
        <button
          onClick={createTracing}
          type="button"
          form="addNewTracing"
          className={`${styles} ${
            mode === "creating" ? "hidden" : ""
          } bg-slate-800`}
        >
          <PlusIcon />
        </button>
        <button
          onClick={closeForm}
          type="button"
          form="addNewTracing"
          className={`${styles} ${
            mode === "creating" ? "" : "hidden"
          }bg-red-800`}
        >
          <XIcon className={`${mode === "creating" ? "" : "hidden"}`} />
        </button>
      </>
    );
  };

  const newTracing = () => {
    return (
      <>
        <form
          id="addNewTracing"
          onSubmit={handleSubmit(onSubmit)}
          className="grid grid-cols-12 gap-x-1 scale-95 mb-3  max-w-xs overflow-y-hidden"
        >
          <input
            autoComplete="off"
            className="text-3xl col-span-10 appearance-none"
            type="text"
            {...register("comment", { required: true })}
          />
          <span className="col-span-2 flex justify-center items-center">
            <button
              type="submit"
              form="addNewTracing"
              className={`p-1 rounded-sm hover:translate-x-1 transition-transform text-slate-200 bg-green-800`}
            >
              <SaveIcon />
            </button>
          </span>
        </form>
        <div className="p-3 mb-5 h-10 select-none opacity-50 font-semibold text-right dark:text-slate-200 dark:bg-slate-700 dark:bg-opacity-40">
          {watch("comment")}
        </div>
      </>
    );
  };

  const ListTracings = (tracings) => {
    const handleRemove = (tracing) => {
      dispatch(removeTracing(tracing._id));
    };
    return tracings.map((tracing) => (
      <li
        key={tracing._id}
        className="pb-5 pt-3 px-3 font-semibold text-right dark:text-slate-200 dark:bg-slate-700 dark:bg-opacity-40"
      >
        {tracing.comment}
        <div className="relative -bottom-1">
          <div className="absolute grid grid-flow-col h-6 w-12 ">
            <div className="grid grid-flow-col gap-x-1">
              <button
                onClick={() => {
                  handleRemove(tracing);
                }}
                type="submit"
                form="addNewTracing"
                className="p-1 rounded-sm hover:translate-y-0.5 opacity-50 hover:opacity-100 transition-all text-slate-200 bg-slate-900 bg-opacity-70 hover:bg-red-800 hover:bg-opacity-100"
              >
                <TrashIcon />
              </button>
              <button
                type="submit"
                form="addNewTracing"
                className="p-1 rounded-sm hover:translate-y-0.5 opacity-50 hover:opacity-100 transition-all text-slate-900 bg-slate-200 hover:bg-slate-900 hover:text-slate-200"
              >
                <ArchiveIcon />
              </button>
            </div>
          </div>
        </div>
      </li>
    ));
  };

  return (
    <div className={styles.tracingsGrid}>
      <div className="col-span-1">
        {addTracingButton({ styles: styles.addTracingButton })}
      </div>
      <div className="col-span-9 grid items-center">
        <span className={`${mode === "creating" ? "" : "hidden"}`}>
          {newTracing({ styles: styles.addTracingButton })}
        </span>
        <ul className="grid px-1 gap-3">{ListTracings(tracings)}</ul>
      </div>
    </div>
  );
}
