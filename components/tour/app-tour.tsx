"use client";

import { useCallback } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

export function useAppTour() {
  const startTour = useCallback(() => {
    const driverObj = driver({
      showProgress: true,
      animate: true,
      smoothScroll: true,
      nextBtnText: "Siguiente →",
      prevBtnText: "← Anterior",
      doneBtnText: "¡Listo!",
      progressText: "{{current}} de {{total}}",
      popoverClass: "hugadmin-tour-popover",
      steps: [
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
          element: "#tour-view-switcher",
          popover: {
            title: "Vista",
            description:
              "Overview muestra todos los expedientes con el pipeline completo. Focus muestra solo los que marcaste con estrella.",
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
          element: "#tour-user-menu",
          popover: {
            title: "Tu perfil",
            description:
              "Accedé a tu perfil, información del sistema y (si sos admin) al panel de administración.",
            side: "bottom",
            align: "end",
          },
        },
      ],
    });

    driverObj.drive();
  }, []);

  return { startTour };
}
