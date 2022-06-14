import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";

import { Alert } from "../../../commons/alert/Alert";
import { Spinner } from "../../../commons/spinner/Spinner";

import { Transition } from "@headlessui/react";
import { XIcon, ShieldExclamationIcon } from "@heroicons/react/outline";

import { login, selectLoginStatus, selectLoginMessage } from "../loginSlice";

import styles from "../Login.module.css";

export function LoginForm() {
  const dispatch = useDispatch();

  const loginStatus = useSelector(selectLoginStatus);
  const loginMessage = useSelector(selectLoginMessage);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const onSubmit = (data) => dispatch(login(data));

  return (
    <>
      {loginStatus === "loading" && <Spinner />}
      {loginStatus !== "loading" && (
        <form className={styles.loginForm} onSubmit={handleSubmit(onSubmit)}>
          {loginStatus === "error" && (
            <Alert
              text={loginMessage}
              icon={<ShieldExclamationIcon className="h-10" />}
              error
            />
          )}
          <Transition
            className="h-full pb-5 grid"
            appear={true}
            show={loginStatus !== "loading"}
            enter="transition-opacity duration-1000"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity duration-1000"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="w-full grid gap-1">
              <input
                className={styles.emailInput}
                type="email"
                placeholder="correo@de.registro"
                {...register("email", { required: true })}
              />
              {errors.email && <Alert dense text="Email es requerido" error />}
              <input
                className={styles.passwordInput}
                type="password"
                placeholder="Password"
                {...register("password", { required: true })}
              />
              {errors.password && (
                <Alert dense text="Password es requerido" error />
              )}
            </div>
            <input
              type="submit"
              className={styles.submitButton}
              value="Iniciar Sesión"
            />
          </Transition>
        </form>
      )}
    </>
  );
}
