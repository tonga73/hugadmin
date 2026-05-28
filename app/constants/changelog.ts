export type ChangelogEntry = {
  version: string;
  date: string;
  summary: string;
  changes: string[];
};

export const CHANGELOG_ENTRIES: ChangelogEntry[] = [
  {
    version: "2.2.0",
    date: "2026-05-28",
    summary: "Nuevos estados de trámite",
    changes: [
      "Se agregaron 2 nuevos estados de trámite: \"Sin posibilidad de cobro\" e \"Inicio Ejecutivo\"",
      "Nueva sección de novedades accesible desde el menú de usuario",
    ],
  },
  {
    version: "2.1.0",
    date: "2026-05-05",
    summary: "Modo mantenimiento y mejoras de administración",
    changes: [
      "Modo mantenimiento: bloquea el acceso a usuarios no-administradores",
      "Gestión de usuarios mejorada: activar/desactivar, mostrar/ocultar en listas",
      "Panel de administración con edición de rol y nombre de usuario",
      "Integración con Google Drive mejorada con actualizaciones en tiempo real",
    ],
  },
  {
    version: "2.0.0",
    date: "2025",
    summary: "Reescritura completa del sistema",
    changes: [
      "Sistema rediseñado desde cero con tecnología moderna",
      "Nueva interfaz más rápida y responsive",
      "Gestión completa de expedientes con archivos adjuntos",
      "Sincronización automática con Google Drive",
      "Asistente de inteligencia artificial para clasificar archivos",
      "Autenticación segura con cuenta de Google",
    ],
  },
];
