import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useForm } from "react-hook-form";

import { getRecord, selectRecord } from "./recordSlice";

import { PrioritySelect } from "./selectInputs/PrioritySelect";
import { StatusSelect } from "./selectInputs/StatusSelect";

import styles from "./Record.module.css";

export function Record() {
  const dispatch = useDispatch();
  const record = useSelector(selectRecord);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const onSubmit = (data) => {};

  function showLocation() {
    if (record.location) {
      return (
        <>
          <input
            defaultValue={record.location.name}
            {...register("location-name")}
          />
          <input
            defaultValue={record.location.court}
            {...register("location-court")}
          />
        </>
      );
    }
    return;
  }

  function showRecord() {
    return (
      <>
        <span>
          <PrioritySelect />
          <StatusSelect />
        </span>
        <input
          id="order"
          type="text"
          defaultValue={record.order}
          {...register("order")}
        />
        <input
          id="cover"
          type="text"
          defaultValue={record.cover}
          {...register("cover")}
        />
        {showLocation()}
      </>
    );
  }

  useEffect(() => {
    dispatch(getRecord("629fae9a12c6dd15c4acb8f9"));
  }, []);
  return (
    <div className={styles.recordGrid}>
      <form className={`${styles.recordInfo} dark:text-slate-300`}>
        {showRecord()}
      </form>
      <div className={styles.recordTracings}>tracings</div>
    </div>
  );
}
