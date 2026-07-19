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

## Robustez operativa (para uso diario, no demo)

- **Re-medición LLM endurecida:** modelo por defecto `claude-sonnet-5` (override por `ANTHROPIC_MODEL`/`OPENAI_MODEL`), timeout duro (`LLM_TIMEOUT_MS`, 30s), errores 429/5xx/timeout traducidos a mensaje accionable, y detección de marca robusta (insensible a acentos, con límites de palabra → sin falsos positivos por subcadena).
- **Persistencia a prueba de fallos:** la Action Queue se escribe de forma **atómica** (tmp+rename) y las escrituras se **serializan por cliente** (sin condición de carrera lectura-modificación-escritura).
- **Contrato de datos + validación runtime:** [`CONTRATO_DATOS_feed.md`](CONTRATO_DATOS_feed.md) define lo que Relevant debe entregar; [`src/feedContract.js`](src/feedContract.js) lo valida en runtime y expone `client.feedHealth`. El módulo **Fuentes & Datos** muestra el cockpit: backend online/offline, proveedor LLM activo, cobertura de fuentes e **integridad del feed** (avisa qué secciones llegan vacías, para que un volcado parcial no deje módulos silenciosamente mudos).

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

**Los 18 módulos están implementados y leen del feed** (config-driven): Torre de Control · Ciclo GEO · Visibilidad IA / GEO Twin · Data Resultados IA · Brand vs Link · Prompts & Tracking · Narrativas & Claims · Autoridad · Tráfico IA (GA4) · Competidores · Local/HORECA · AI Overview/SERP · Fuentes & Datos · Action Queue · Riesgo & Alertas · Agentes · Gobierno & Roles · Formación · Reporting (+ Alta de Cliente, solo platform-admin).

Ninguno es un placeholder: cada uno renderiza su sección del feed con badge de estado. Lo que hoy llega vacío (p.ej. `ga4_ai_traffic`, `serp`) es **dato pendiente del pipeline de Relevant**, no vista sin construir — y el cockpit de **Fuentes & Datos** lo señala explícitamente (ver más abajo).

## Regla de oro (heredada de GEO-OS)

Cada dato del feed declara su estado: `real` / `cualitativo` / `pendiente`. Nada inventado. El badge de estado se muestra en cada vista.

## Cómo se conecta el pipeline de Relevant

Hoy `feed.json` es un fichero estático que respeta el contrato de datos. En producción, RT AI GEO Tool (Node/Express + BigQuery) expone ese mismo JSON por endpoint/dataset por tenant; el core solo cambia el `data_source` del `config.json`. No se toca ningún componente.

## Alta de un cliente nuevo

1. Crear `public/clients/<nuevo>/config.json` (marca, dominios, roles).
2. Apuntar `data_source` a su dataset / endpoint.
3. `VITE_CLIENT=<nuevo> npm run build`. Cero cambios en el core.
