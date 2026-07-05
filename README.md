# GEO-OS · Core config-driven (Fase 1)

Plataforma multi-cliente de operación GEO. **IP: Cupperlab** (capa de plataforma/operación). **Datos: pipeline Relevant** (proveedores → BigQuery → tabla única).

Un cliente = **un `config.json` + un `feed.json`**. El core no cambia entre clientes.

## Arranque (herramienta en funcionamiento — no demo)

Dos procesos. **Terminal 1 (backend real):**

```bash
cd geo-os
npm install
cp .env.example .env      # y pega tu ANTHROPIC_API_KEY (o OPENAI_API_KEY)
npm run server            # backend en http://localhost:3001
```

**Terminal 2 (frontend):**

```bash
npm run dev               # http://localhost:5173  (proxya /api al backend)
```

Sin backend, la app sigue abriendo con el feed estático (modo degradado); pero el loop real
(persistencia de acciones + re-medición en IA) requiere el backend arriba.

`npm run build` genera `dist/` para deploy web.

## Qué funciona de verdad hoy

- **Ciclo GEO conectado:** "Propone" crea una tarjeta **persistida** en la Action Queue; "Aprueba/Ejecuta" la mueven de columna; **"Re-mide" consulta el LLM real** (Anthropic/OpenAI) con el prompt del caso y detecta si la marca aparece. El marcador y la bitácora se actualizan con el resultado real.
- **Action Queue persistente** en `server/data/<cliente>-actions.json` (CRUD real vía API).
- **Torre** refleja en "qué hacer" las acciones vivas del backend.

## Pendiente de Relevant (integración de datos)

El `feed.json` (visibilidad, autoridad, volúmenes, brand vs link) hoy es fichero. La ingesta real
desde DataForSEO/SE Ranking/Ahrefs/BigQuery la sirve el pipeline de Relevant sustituyendo el endpoint
`GET /api/client/:id/feed` por la tabla única por tenant. El core no cambia.

## Login (demo Mahou)

| Rol | Usuario / contraseña | Ve |
|---|---|---|
| Administrador | `admin` / `rtcupper2026*` | Todo (18 módulos) |
| Squad GEO | `SquadGEO` / `msm2026*` | Todo lo operativo |
| Operador Marcas | `marcasuser` / `msmmarcas2026*` | Subset (role-gating) |
| Operador Hostelería | `hosteleriauser` / `msmhost2026*` | Subset, aterriza en HORECA |

## Arquitectura

```
public/clients/<id>/config.json   → identidad white-label, dominios, marcas, roles, targets
public/clients/<id>/feed.json     → "tabla única" normalizada (la llena el pipeline de Relevant)
src/stores/client.js              → carga config + feed, login/role-gating
src/theme.js                      → aplica tema white-label (CSS vars) desde config
src/modules/registry.js           → registro único de módulos (router + nav se derivan de aquí)
src/layout/AppShell.vue           → sidebar filtrada por rol + header
src/modules/*.vue                 → módulos (leen del feed + config)
```

Cliente activo por env: `VITE_CLIENT=otrocliente npm run dev` (por defecto `mahou`).

## Estado de los módulos (Fase 1)

**Implementados leyendo del feed:** Torre de Control · Visibilidad IA / GEO Twin · Data Resultados IA · Brand vs Link · Prompts & Tracking · Autoridad · Competidores · Riesgo & Alertas · Action Queue · Gobierno & Roles.

**Registrados como stub** (cableados en nav/router/role-gating, pendientes de vista bespoke): Ciclo GEO · Narrativas & Claims · Tráfico IA (GA4) · Local/HORECA · AI Overview/SERP · Agentes · Formación · Reporting.

## Regla de oro (heredada de GEO-OS)

Cada dato del feed declara su estado: `real` / `cualitativo` / `pendiente`. Nada inventado. El badge de estado se muestra en cada vista.

## Cómo se conecta el pipeline de Relevant

Hoy `feed.json` es un fichero estático que respeta el contrato de datos. En producción, RT AI GEO Tool (Node/Express + BigQuery) expone ese mismo JSON por endpoint/dataset por tenant; el core solo cambia el `data_source` del `config.json`. No se toca ningún componente.

## Alta de un cliente nuevo

1. Crear `public/clients/<nuevo>/config.json` (marca, dominios, roles).
2. Apuntar `data_source` a su dataset / endpoint.
3. `VITE_CLIENT=<nuevo> npm run build`. Cero cambios en el core.
