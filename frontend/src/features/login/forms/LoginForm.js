import React from "react";
import { useDispatch } from "react-redux";
import { useForm } from "react-hook-form";

import { login } from "../loginSlice";

import styles from "../Login.module.css";

export function LoginForm() {
  const dispatch = useDispatch();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const onSubmit = (data) => dispatch(login(data));

  return (
    <>
      <form className={styles.loginForm} onSubmit={handleSubmit(onSubmit)}>
        <input
          className={styles.emailInput}
          type="email"
          placeholder="correo@de.registro"
          {...register("email", { required: true })}
        />
        {errors.email && <span>Este campo es requerido</span>}
        <input
          className={styles.passwordInput}
          type="password"
          placeholder="Password"
          {...register("password", { required: true })}
        />
        {errors.password && <span>Este campo es requerido</span>}
        <input
          type="submit"
          className={styles.submitButton}
          value="Iniciar Sesión"
        />
      </form>
    </>
  );
}
