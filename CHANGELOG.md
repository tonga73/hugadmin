# Changelog

Todas las versiones notables de hugadmin se documentan aquí.
Formato basado en [Keep a Changelog](https://keepachangelog.com/es/1.0.0/).
Versiones siguiendo [Semantic Versioning](https://semver.org/lang/es/): `MAJOR.MINOR.PATCH`

---

## [2.2.0] — 2026-05-28

### Agregado
- Estado de trámite "Sin posibilidad de cobro"
- Estado de trámite "Inicio Ejecutivo"
- Página `/changelog` con novedades del sistema accesible para todos los usuarios
- Constante `APP_VERSION` centralizada (`app/constants/version.ts`) — elimina versión hardcodeada
- Entradas de changelog en `app/constants/changelog.ts` con descripción amigable por versión
- Ítem "Novedades" en menú de usuario (dropdown)

---

## [2.1.0] — 2026-05-05

### Agregado
- Modo mantenimiento: bloquea acceso a usuarios no-ADMIN, toggle desde panel de admin
- Campo `active` en usuarios: impide login y excluye de listas de asignación
- Campo `visible` en usuarios: oculta de listas del sistema sin desactivar
- Panel de admin mejorado: edición de rol y nombre, toggle activo/visible
- Lista de usuarios con sort (nombre, rol, vista), sección "ocultos" y collapsible para inactivos
- Componente `ToggleSwitch` reutilizable con fix de overflow
- API `PATCH /api/users/[id]` para editar rol, nombre, active, visible (solo ADMIN)
- API `GET/PATCH /api/config/maintenance` para modo mantenimiento

### Cambiado
- Integración Google Drive migrada de service account a OAuth2 con refresh token
- Sync Drive ahora soporta webhook push para actualizaciones en tiempo real
- Sync incremental vía `changes.list` con page token persistido en tabla `Config`
- Panel de admin: filtros de vista removidos (ahora cada usuario los gestiona desde su sesión)
- `GET /api/users` filtra por `visible: true` en lugar de retornar todos

### Infraestructura
- Modelo `Config` agregado al schema (key-value para configuración del sistema)
- Script `get-oauth-token.ts` para obtener refresh token OAuth de Drive
- Webhook endpoint `POST /api/sync/webhook` para push notifications de Drive
- CLAUDE.md con documentación del proyecto para Claude Code

---

## [2.0.0] — 2025 (fecha aproximada)

Reescritura completa desde React + Redux a Next.js 15 App Router.

### Stack nuevo
- Next.js 15 con App Router y Server Components
- Prisma + PostgreSQL (Railway)
- Autenticación Google OAuth con sesión por cookie
- Google Drive como storage principal
- Tailwind + shadcn/ui

### Funcionalidades base
- Gestión de expedientes (CRUD completo)
- Archivos por expediente con categorías (Drive, Apartado, Expediente)
- Dashboard con vistas Overview, Etapa, Focus
- Asignación de usuarios a expedientes
- Notas por expediente
- Filtros por estado (tracing), prioridad, favoritos
- Panel de administración básico
- Sync con Google Drive (service account)
- Matching de archivos con IA (Claude Haiku)

---

## [1.x] — anterior

Primera versión: React (CRA) + Redux. Migrado y descontinuado.
