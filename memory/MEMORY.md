# hugadmin – Project Memory

## Stack
- Next.js 16, React 19, TypeScript, pnpm
- Prisma (ORM) + Firebase (auth)
- Tailwind CSS v4, Radix UI, shadcn components
- React Hook Form + Zod for forms
- Sonner for toasts

## Architecture
- App Router (`app/` directory), no `src/`
- Alias `@/` maps to project root
- API routes under `app/api/`
- Page components under `app/(pages)/`
- Auth under `app/(auth)/`
- Shared components under `components/`

## AI Features
- `app/api/ai/analyze/route.ts` – POST streaming endpoint: carga expediente + archivos, llama a Claude Haiku, devuelve análisis en tiempo real
- `components/ai/record-analyzer.tsx` – Sheet lateral con botón Sparkles en detalle de expediente; acciones concretas (prioridad/tracing) por definir

## Key Files
- `components/records/record-form.tsx` – Create record form (React Hook Form + Zod)
- `app/(pages)/records/[id]/editable-record-page.tsx` – Edit record (click-to-edit)
- `app/(pages)/records/[id]/editable-field.tsx` – Inline editable text field
- `app/(pages)/records/[id]/editable-list.tsx` – Inline editable list of strings
- `app/(pages)/records/[id]/editable-select.tsx` – Inline editable select
- `app/(pages)/records/[id]/note-card.tsx` – Note card (click-to-edit)
- `lib/save-config.ts` – `SAVE_CONFIG` (mode: "manual" | "onBlur" | "debounce")
- `app/generated/prisma/enums.ts` – Tracing, Priority, Role enums
- `app/constants/tracing.ts` – TRACING_OPTIONS with label/color/textColor
- `app/constants/priority.ts` – PRIORITY_OPTIONS

## Testing Setup (added)
- Framework: **Vitest** + @testing-library/react + @testing-library/user-event + jsdom
- Config: `vitest.config.ts` + `vitest.setup.ts`
- Test files: `__tests__/` directory (api/, lib/, components/)
- Run: `pnpm test:run` (single run) | `pnpm test` (watch)
- 69 tests passing as of setup

## Key Patterns
- Click-to-edit: all editable fields show value in display mode, click to switch to input
- EditableField saves onBlur/Enter/manual button (based on SAVE_CONFIG.mode)
- Inline saves via PATCH /api/records/[id] dispatching `update-record` custom event
- Create form uses 3-col grid (col-span-2 main card + 1 details card)

## User Preferences
- Spanish UI throughout
- Preserve click-to-edit functionality
- pnpm as package manager
