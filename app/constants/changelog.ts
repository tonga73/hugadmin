export type ChangelogEntry = {
  version: string;
  date: string;
  summary: string;
  changes: string[];
};

export const CHANGELOG_ENTRIES: ChangelogEntry[] = [
  {
    version: "2.3.0",
    date: "2026-05-28",
    summary: "Apartado listo y mejoras visuales",
    changes: [
      "Podés marcar el apartado de un expediente como \"listo\" desde la sección de archivos, cuando ya hay uno subido",
      "Los colores de cada estado de trámite se renovaron: más suaves y fáciles de distinguir entre sí",
    ],
  },
  {
    version: "2.2.0",
    date: "2026-05-28",
    summary: "Nuevos estados de trámite",
    changes: [
      "Se agregaron 2 nuevos estados: \"Sin posibilidad de cobro\" e \"Inicio Ejecutivo\"",
      "Nueva sección Novedades en el menú de usuario para ver los cambios del sistema",
    ],
  },
  {
    version: "2.1.0",
    date: "2026-05-05",
    summary: "Sincronización mejorada",
    changes: [
      "Los archivos de Google Drive ahora se sincronizan automáticamente sin necesidad de actualizar la página",
    ],
  },
  {
    version: "2.0.0",
    date: "2025",
    summary: "Nueva versión del sistema",
    changes: [
      "Interfaz completamente rediseñada, más rápida y adaptable a cualquier pantalla",
      "Gestión de expedientes con archivos adjuntos por categoría",
      "Sincronización automática con Google Drive",
      "Asistente de inteligencia artificial para clasificar archivos automáticamente",
      "Inicio de sesión con cuenta de Google",
    ],
  },
];
