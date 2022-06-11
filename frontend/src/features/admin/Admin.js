import React from "react";

export function Admin() {
  return (
    <div className="grid grid-cols-3">
      <div className="col-start-2 py-5">
        <h1 className="text-center text-5xl font-extrabold opacity-5 uppercase dark:text-slate-200">
          Administración
        </h1>
      </div>
      <div className="col-span-3 grid grid-cols-3">
        <div className="flex flex-col gap-3">
          <h3 className="dark:text-slate-200 text-3xl uppercase text-center">
            Crear Usuario
          </h3>
          <form action="" className="grid grid-cols-1 gap-3 mx-auto w-4/5">
            <input
              placeholder="Nombre"
              type="text"
              className="dark:bg-slate-800 dark:text-slate-200 px-3 opacity-70 text-xl h-10"
            />
            <input
              placeholder="Email"
              type="text"
              className="dark:bg-slate-800 dark:text-slate-200 px-3 opacity-70 text-xl h-10"
            />
            <input
              type="submit"
              value="Crear"
              className="py-3 uppercase font-bold dark:text-slate-200 bg-purple-700"
            />
          </form>
        </div>
      </div>
    </div>
  );
}
