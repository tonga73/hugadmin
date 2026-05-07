---
name: AI analyzer panel
description: Panel de análisis IA por expediente — estado actual y próximos pasos planificados
type: project
---

Integración de IA para análisis de expedientes judiciales.

**Estado actual (implementado):**
- `app/api/ai/analyze/route.ts` — endpoint POST con streaming (SSE). Carga el expediente completo (metadatos, notas, archivos adjuntos con texto extraído), llama a `claude-haiku-4-5-20251001` y devuelve streaming de texto.
- `components/ai/record-analyzer.tsx` — sheet lateral con botón Sparkles (✦) en el detalle del expediente. Muestra respuesta en tiempo real con cursor parpadeante. Permite reintentar.
- Botón integrado en `editable-record-page.tsx` junto a los demás controles del expediente.

**Por definir:**
- Acciones concretas que la IA puede sugerir (cambio de prioridad, cambio de tracing) — usuario quiere hacerlo después
- Si las sugerencias deben ser confirmables con botones o solo narrativas

**Why:** El usuario quiere usar la IA más allá del matching de archivos — revisión de expedientes viejos, sugerencias de prioridad/estado basadas en el contenido digital del expediente.

**How to apply:** Al agregar acciones concretas, el endpoint debería devolver JSON estructurado con narrative + suggested_actions. El componente RecordAnalyzer parsearía eso y mostraría botones de confirmación al final del análisis.
