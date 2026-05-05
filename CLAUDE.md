# hugadmin — CLAUDE.md

Sistema de gestión de expedientes judiciales para un estudio de abogados argentino. Permite administrar expedientes, archivos, usuarios y sincronización con Google Drive.

## Stack

- **Framework**: Next.js 15 App Router (TypeScript)
- **DB**: PostgreSQL vía Prisma (schema-first con `db push`, sin migrations)
- **ORM**: Prisma con Prisma Accelerate en producción
- **Deploy**: Railway (push a `main` dispara deploy automático)
- **Auth**: Google OAuth + sesión por cookie firmada (`lib/session.ts`)
- **Storage**: Google Drive OAuth2 con refresh token (`lib/drive-client.ts`)
- **AI**: Anthropic SDK — `claude-haiku-4-5-20251001` para matching de archivos (`lib/ai-matcher.ts`)
- **UI**: Tailwind + shadcn/ui + Lucide icons
- **Tests**: Vitest (131 tests, corren en pre-commit via Husky)
- **Package manager**: pnpm

## Comandos clave

```bash
pnpm dev              # servidor local
pnpm test:run         # tests una sola vez
pnpm db:push          # sincroniza schema a DB local
pnpm db:push:prod     # sincroniza schema a DB de Railway (usa DATABASE_URL_PROD del .env)
pnpm build            # build de producción
```

## Estructura del proyecto

```
app/
  (pages)/            # rutas protegidas con layout (sidebar + nav)
    (dashboard)/      # página principal con lista de expedientes
    records/          # detalle de expediente + archivos
    admin/            # panel de administración (solo ADMIN)
    profile/
    settings/
    unassigned/       # archivos sin asignar a expediente
  api/                # API routes (Next.js Route Handlers)
    records/          # CRUD expedientes
    files/            # CRUD archivos
    users/            # gestión de usuarios
    config/           # configuración del sistema (ej: maintenance_mode)
    sync/             # sync Drive (SSE + webhook)
    cron/sync/        # endpoint para cron de Railway
    auth/             # login/logout
  maintenance/        # página pública mostrada en modo mantenimiento
  generated/prisma/   # cliente Prisma generado (no editar)
lib/
  session.ts          # getSessionUser() — usar en todas las rutas que requieran auth
  user-config.ts      # getUserRole(), getUserViewConfig()
  drive-client.ts     # getDriveClient() — singleton OAuth2 para Drive
  drive-sync.ts       # syncDrive(), syncDriveIncremental(), webhook renewal
  storage.ts          # uploadFile(), downloadFile(), deleteFile(), createDriveDoc()
  ai-matcher.ts       # extractText(), matchFileToRecord()
  prisma.ts           # cliente Prisma singleton
prisma/
  schema.prisma       # fuente de verdad del schema — NO hay carpeta migrations
scripts/
  get-oauth-token.ts  # one-time: obtener refresh token de Drive
  import-from-drive.ts # one-time: importar archivos Drive a DB con AI matching
  db-push-prod.sh     # usado por pnpm db:push:prod
```

## Modelos principales

- **Record** — expediente judicial (tiene order, name, tracing, priority, officeId)
- **RecordFile** — archivo adjunto al expediente (puede venir de Drive, Apartado o Expediente)
- **User** — roles: `USER | ADMIN | PART | CLIENT`
- **UserViewConfig** — preferencias de vista por usuario (dashboardView, filtros)
- **Config** — key-value para config del sistema (ej: `maintenance_mode`, tokens de webhook Drive)
- **RecordsAndUser** — relación many-to-many entre Record y User

## Roles de usuario

- **ADMIN**: acceso total, incluyendo panel `/admin`
- **USER**: acceso completo a expedientes y archivos, sin gestión de usuarios ni app
- **PART**: participante externo del expediente
- **CLIENT**: cliente con acceso limitado

## Autenticación y permisos

- Toda ruta protegida usa `getSessionUser()` de `lib/session.ts`
- Para endpoints admin-only, copiar el patrón `requireAdmin()` de `app/api/users/[id]/config/route.ts`
- El layout `app/(pages)/layout.tsx` chequea `maintenance_mode` en Config — si está activo, redirige a `/maintenance` a todos los no-ADMIN
- Las páginas del grupo `(pages)/admin/` tienen redirect a `/` si el rol no es ADMIN

## Google Drive

- Autenticación: OAuth2 con refresh token (NO service account)
- Variables necesarias: `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `GOOGLE_OAUTH_REFRESH_TOKEN`
- Para obtener el refresh token inicial: `npx tsx scripts/get-oauth-token.ts` (requiere autorización del dueño de la cuenta)
- Sync completo: cron en Railway cada 6h vía `GET /api/cron/sync` con `Authorization: Bearer <CRON_SECRET>`
- Sync incremental: webhook de Google Drive → `POST /api/sync/webhook` (canal de 7 días, se renueva solo)
- El folder raíz de Drive se configura con `GOOGLE_DRIVE_FOLDER_ID`

## Variables de entorno (.env)

```
DATABASE_URL           # PostgreSQL local
DATABASE_URL_PROD      # PostgreSQL Railway (solo para db:push:prod)
ANTHROPIC_API_KEY      # console.anthropic.com — misma cuenta de Anthropic
GOOGLE_OAUTH_CLIENT_ID
GOOGLE_OAUTH_CLIENT_SECRET
GOOGLE_OAUTH_REFRESH_TOKEN
GOOGLE_DRIVE_FOLDER_ID
GOOGLE_DRIVE_OWNER_EMAIL
APP_URL                # URL pública de producción
CRON_SECRET            # Bearer token para el endpoint de cron
DRIVE_WEBHOOK_SECRET   # Header token para validar webhook de Drive
```

## Convenciones

- Schema changes → siempre `pnpm db:push` en local, `pnpm db:push:prod` antes del deploy
- No hay carpeta `migrations/` — Prisma usa `db push` directamente
- Los tests corren automáticamente en pre-commit (Husky) — no usar `--no-verify`
- Commits van a `develop`, se mergea a `main` cuando está listo para producción
- Railway deploya automáticamente al hacer push a `main`
- **Commits**: mensaje breve pero explicativo — una línea que diga qué cambió y por qué, sin ser críptico ni verboso
- **Push**: siempre confirmar con el usuario antes de hacer `git push`, sin excepción
- No agregar comentarios obvios al código; solo cuando el *porqué* no es evidente
- Preferir editar archivos existentes antes de crear nuevos

## Modo mantenimiento

Activar/desactivar desde `/admin` → toggle "Modo mantenimiento". Bloquea acceso a todos los usuarios no-ADMIN redirigiendo a `/maintenance`. Estado en tabla `Config` con key `maintenance_mode`.
