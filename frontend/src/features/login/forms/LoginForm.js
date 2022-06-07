import React, { useState } from "react";

import { LockClosedIcon } from "@heroicons/react/solid";

import styles from "../Login.module.css";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <>
      <form className={styles.loginForm} action="">
        <input
          className={styles.emailInput}
          type="text"
          placeholder="correo@de.registro"
        />
        <input
          className={styles.passwordInput}
          type="password"
          placeholder="Password"
        />
        <button type="submit" className={styles.submitButton}>
          Iniciar Sesion
        </button>
      </form>
    </>
  );
}
