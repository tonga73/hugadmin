"use client";

import { useCallback } from "react";
import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";
import { useView } from "@/contexts/view-context";

const COMMON_NAV_STEPS: DriveStep[] = [
  {
    element: "#tour-home-button",
    popover: {
      title: "Inicio",
      description: "Volvé al panel principal desde cualquier parte del sistema.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#tour-view-switcher",
    popover: {
      title: "Modo de vista",
      description:
        "Overview muestra el panel completo con la barra lateral de expedientes. Focus es una vista sin barra lateral, pensada para revisar y gestionar causas de forma más concentrada.",
      side: "bottom",
    },
  },
  {
    element: "#tour-notification-bell",
    popover: {
      title: "Notificaciones",
      description:
        "Te avisamos cuando te asignan a un expediente, recibís un mensaje o se actualizó algún caso que tenés asignado.",
      side: "bottom",
      align: "end",
    },
  },
  {
    element: "#tour-chat-button",
    popover: {
      title: "Mensajes",
      description:
        "Mensajes en tiempo real con tu equipo. Podés crear chats individuales o grupales y compartir expedientes.",
      side: "bottom",
      align: "end",
    },
  },
  {
    element: "#tour-mode-toggle",
    popover: {
      title: "Tema claro / oscuro",
      description:
        "Cambiá entre el modo claro, oscuro o según tu sistema operativo.",
      side: "bottom",
      align: "end",
    },
  },
  {
    element: "#tour-user-menu",
    popover: {
      title: "Tu perfil",
      description:
        "Accedé a tu perfil, información del sistema y opciones de la cuenta.",
      side: "bottom",
      align: "end",
    },
  },
];

const OVERVIEW_STEPS: DriveStep[] = [
  {
    popover: {
      title: "Bienvenido a Hugadmin",
      description:
        "Este recorrido rápido te muestra las funciones principales del sistema. Usá las flechas para navegar o cerrá cuando quieras.",
    },
  },
  {
    element: "#tour-records-list",
    popover: {
      title: "Expedientes",
      description:
        "Todos tus expedientes aparecen aquí ordenados por actividad. Podés filtrar por estado, prioridad, favoritos y asignados a vos.",
      side: "right",
      align: "start",
    },
  },
  {
    element: "#tour-create-record",
    popover: {
      title: "Nuevo expediente",
      description:
        "Creá un expediente con carátula, número de orden, juzgado y partes involucradas.",
      side: "right",
      align: "start",
    },
  },
  {
    element: "#tour-unassigned",
    popover: {
      title: "Archivos sin asignar",
      description:
        "Acá aparecen los archivos que llegaron desde Drive pero todavía no están vinculados a ningún expediente. Podés asignarlos manualmente o dejarlos para después.",
      side: "right",
      align: "start",
    },
  },
  ...COMMON_NAV_STEPS,
];

const FOCUS_STEPS: DriveStep[] = [
  {
    popover: {
      title: "Bienvenido al modo Focus",
      description:
        "Una vista sin barra lateral pensada para trabajar de forma más concentrada. Todos los expedientes en pantalla completa, con búsqueda y filtros integrados.",
    },
  },
  {
    element: "#tour-focus-stats",
    popover: {
      title: "Resumen",
      description:
        "Un vistazo rápido al estado general: total de causas, urgentes, de alta prioridad y destacadas.",
      side: "bottom",
    },
  },
  {
    element: "#tour-focus-records",
    popover: {
      title: "Lista de expedientes",
      description:
        "Buscá, filtrá y navegá tus causas directamente desde acá. El buscador abre una pantalla completa para encontrar cualquier expediente al instante.",
      side: "top",
    },
  },
  {
    element: "#tour-focus-create",
    popover: {
      title: "Nuevo expediente",
      description:
        "Creá un expediente nuevo sin salir del modo Focus.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#tour-focus-unassigned",
    popover: {
      title: "Archivos sin asignar",
      description:
        "Archivos recibidos desde Drive que todavía no tienen expediente asignado.",
      side: "bottom",
      align: "start",
    },
  },
  ...COMMON_NAV_STEPS,
];

export function useAppTour() {
  const { isFocus } = useView();

  const startTour = useCallback(() => {
    const steps = isFocus ? FOCUS_STEPS : OVERVIEW_STEPS;

    const driverObj = driver({
      showProgress: true,
      animate: true,
      smoothScroll: true,
      nextBtnText: "Siguiente →",
      prevBtnText: "← Anterior",
      doneBtnText: "¡Listo!",
      progressText: "{{current}} de {{total}}",
      popoverClass: "hugadmin-tour-popover",
      steps,
    });

    driverObj.drive();
  }, [isFocus]);

  return { startTour };
}
