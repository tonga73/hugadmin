import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useForm } from "react-hook-form";

import { getUsers, selectUsers, newUserAsync } from "../admin/adminSlice";

import { Tabs } from "../../commons/tabs/Tabs";

import { ClipboardButton } from "../../commons/buttons/clipboardButton/ClipboardButton";
import { TextInput } from "../../commons/inputs/TextInput";

export function Admin() {
  const dispatch = useDispatch();
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm();
  const onSubmit = (data) => console.log(data);
  const users = useSelector(selectUsers);

  const UsersTable = () => {
    return (
      <table className="dark:bg-slate-900 w-full text-right cursor-default select-none">
        <thead className="dark:bg-slate-900">
          <tr className="dark:text-slate-200 text-lg uppercase opacity-20">
            <th>Nombre</th>
            <th>Permisos</th>
            <th>Correo electrónico</th>
          </tr>
        </thead>
        <tbody className="text-xl">
          {users.map((user) => (
            <tr
              key={user._id}
              className="border-y-4 border-y-slate-700 border-opacity-50 text-slate-300 font-semibold hover:bg-white hover:text-slate-900 transition-colors opacity-50"
            >
              <td>{user.name}</td>
              <td>{user.role}</td>
              <td>
                {user.email}
                <ClipboardButton value={"olis"} />
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="text-lg uppercase font-bold dark:text-slate-200 opacity-10">
          <tr>
            <td>TOTAL</td>
            <td>{users.length}</td>
          </tr>
        </tfoot>
      </table>
    );
  };

  useEffect(() => {
    dispatch(getUsers(""));
  }, [dispatch]);

  return (
    <div className="grid grid-cols-3 container mx-auto">
      <div className="col-span-3 py-5">
        <h1 className="text-center text-5xl font-extrabold opacity-5 uppercase dark:text-slate-200">
          Panel de Administración
        </h1>
      </div>
      <div className="col-span-3">
        <Tabs>
          <h3 className="dark:text-slate-200 text-3xl uppercase text-center">
            General
          </h3>
          <h3 className="dark:text-slate-200 text-3xl uppercase text-center">
            Usuarios
          </h3>
          <h3 className="dark:text-slate-200 text-3xl uppercase text-center">
            Juzgados
          </h3>
        </Tabs>
      </div>
      <div className="col-span-3 grid grid-cols-3">
        <div className="col-span-1 flex flex-col gap-3">
          <h3 className="dark:text-slate-200 text-3xl uppercase text-center">
            Crear Usuario
          </h3>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="grid grid-cols-1 gap-3 mx-auto w-4/5"
          >
            <TextInput
              defaultValue="Invitado"
              placeHolder="Nombre"
              styles="dark:bg-slate-800 dark:text-slate-200 px-3 opacity-70 text-xl h-10"
              {...register("name", { required: true })}
            />
            <TextInput
              defaultValue="invitado@correo.com"
              placeHolder="Email"
              styles="dark:bg-slate-800 dark:text-slate-200 px-3 opacity-70 text-xl h-10"
              {...register("email", { required: true })}
            />
            <TextInput
              defaultValue="invitado"
              placeHolder="Rol (admin, normal, invitado)"
              styles="dark:bg-slate-800 dark:text-slate-200 px-3 opacity-70 text-xl h-10"
              {...register("role", { required: true })}
            />
            <TextInput
              defaultValue="1234"
              placeHolder="Password"
              styles="dark:bg-slate-800 dark:text-slate-200 px-3 opacity-70 text-xl h-10"
              {...register("password", { required: true })}
            />
            <input
              type="submit"
              value="Crear"
              className="py-3 uppercase font-bold dark:text-slate-200 bg-purple-700 cursor-pointer"
            />
          </form>
        </div>
        <div className="col-span-2 grid grid-cols-5">
          <div className="col-span-3 col-end-6">{UsersTable()}</div>
        </div>
      </div>
    </div>
  );
}
