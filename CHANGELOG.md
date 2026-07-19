# Changelog · GEO-OS

Formato basado en [Keep a Changelog](https://keepachangelog.com/es/1.1.0/).
Versionado semántico. Fase 1 = core config-driven multicliente.

## [1.3.0-phase1] — 2026-07-19

Hardening de seguridad para **publicación real** (Render full-stack).

### Añadido
- **Login server-side real**: `POST /client/:id/login` verifica contra hashes **scrypt**
  (`server/data/<id>-auth.json`, gitignored) y emite un **token de sesión HMAC** (12 h).
- **Middleware `requireAuth`** en todas las rutas sensibles (`/api/client/:id/*`, `POST /clients`,
  `PUT /pricing`), con **aislamiento entre tenants** (el token debe ser del cliente de la ruta).
- **Config saneada**: `GET /client/:id/public` (sin credenciales, para el login) y `GET /config`
  autenticado (con usuarios, sin passwords). Feed y config **bloqueados como estáticos**.
- **CORS restringido** por `APP_ORIGIN` y **rate-limit** en login (10/5min) y re-medición (30/min).
- **Deploy**: `render.yaml` (Blueprint), `.node-version`, soporte `DATA_DIR` (disco persistente),
  `SESSION_SECRET`. `DEPLOY.md` reescrito con el flujo real y el primer arranque.
- Bootstrap no destructivo: siembra `auth.json` desde las passwords semilla del config sin
  reescribirlo (un deploy nuevo re-siembra). Cambiar la contraseña en Parametrización manda.

### Cambiado
- El frontend hace **login contra la API** (token en cada request); el feed se carga autenticado.
- Editar roles en Parametrización **hashea las contraseñas** a `auth.json`; nunca se guardan en config.
- `build` elimina `dist/clients` (los configs no se empaquetan) y se quitó el hint de credenciales
  del login: **el bundle ya no contiene contraseñas**.

### Verificado
- Rutas sensibles sin token → 401; token de otro cliente → 403; token manipulado → 401.
- Feed/config estáticos → 401; `dist` sin passwords ni keys; rate-limit de login → 429.
- Login ok/ko, migración no destructiva, rehearsal full-stack (SPA + API mismo origen) y build limpios.

## [1.2.0-phase1] — 2026-07-19

Conexiones por cliente + **control de uso y gasto** por cliente, gestionado desde el admin.

### Añadido
- **Almacén de secretos por cliente** (`server/data/<id>-secrets.json`, **gitignored**): API key del
  LLM y credenciales de proveedores de datos. Las llaves **nunca vuelven al navegador** — la UI solo
  muestra estado (configurada/ausente + proveedor + modelo). Endpoints `GET /connections`,
  `PUT /connections/llm`, `PUT /connections/provider/:name`.
- **Re-medición por credencial del cliente**: `resolveLLM()` usa la key del cliente (fallback a env
  del servidor). La respuesta incluye tokens reales y coste.
- **Ledger de uso y coste** (`server/data/<id>-usage.json`): cada re-medición registra tokens y
  coste (tabla de precios editable, defaults verificables). Endpoints `GET/POST /usage` (ingesta
  manual o del pipeline para proveedores de datos) y `GET/PUT /pricing`.
- **Presupuesto mensual por cliente** (`config.cost_control`: `budget_usd_month` + `mode`
  `alert|block`). En modo bloqueo, la re-medición devuelve **402** al agotarse.
- **Panel Conexiones** (pestaña en Parametrización): key LLM (write-only), `data_source` y
  credenciales de proveedores.
- **Módulo Costes & Uso** (`src/modules/Costes.vue`, admin): gasto del mes por proveedor/modelo,
  barra vs presupuesto, editor de presupuesto y modo, registro de uso externo y tabla de precios.
- `.gitignore`: regla `server/data/*-secrets.json`.

### Verificado
- La API key se guarda en disco pero **no se expone por la API** (solo estado) y **git la ignora**.
- Uso externo se registra y agrega por proveedor; presupuesto en modo bloqueo corta re-medición (402).
- Build de producción limpio.

## [1.1.0-phase1] — 2026-07-19

Autonomía para el usuario funcional: **parametrizar la herramienta desde la propia interfaz**,
sin editar JSON ni usar la terminal.

### Añadido
- **Módulo Parametrización** (`src/modules/Parametrizacion.vue`, solo roles con acceso total):
  edita en caliente, por pestañas, **Identidad & white-label** (nombre, colores, marca visible),
  **Marcas & competidores**, **Roles & accesos** (crear/editar roles, usuarios, contraseñas y qué
  módulos ve cada uno con checkboxes del registry), **KPI targets** y **Prompts monitorizados**.
  Guardar → persiste en backend y reaplica el tema sin recargar la página.
- **Endpoints de persistencia** (`server/index.js`): `PUT /client/:id/config` (con `client_id`
  inmutable y validación de al menos un rol admin) y `PATCH /client/:id/feed` (merge parcial para
  prompts), ambos con escritura atómica + lock por cliente.
- **`client.saveConfig()` / `client.saveFeedPatch()`** y `api.updateConfig()` / `api.patchFeed()`.
- **Flag `requiresFullAccess`** en el registry: gate de módulos a roles con `sees:'all'`.
- **Lanzador sin terminal** (`GEO-OS.command`): doble clic → instala dependencias si hace falta,
  arranca backend+frontend, autocorrige el fallo de rollup entre plataformas y abre el navegador.

### Verificado
- PUT config: rename/colores/marcas persisten, `client_id` inmutable, config inválida (sin admin) → 400.
- PATCH feed: prompts persisten. Ambos **sobreviven al reinicio del servidor**.
- Build de producción limpio; lanzador validado (`bash -n`) y ejecutable.

## [1.0.1-phase1] — 2026-07-18

Endurecimiento para **operar de verdad** (uso diario), no demo. Sin cambios de API pública
ni del contrato de datos: todo es aditivo y retrocompatible.

### Añadido
- **Contrato de datos ejecutable** (`src/feedContract.js`): fuente única de verdad de las 17
  secciones del feed + metadatos de cabecera, con `validateFeed()` que no lanza y devuelve un
  informe accionable (secciones ausentes/vacías, metadatos faltantes).
- **`client.feedHealth`** (getter del store): validación runtime del feed contra el contrato.
- **Documento de contrato** (`CONTRATO_DATOS_feed.md`): lo que el pipeline de Relevant debe
  entregar por tenant, con forma de cada sección y convenciones de estado.
- **Cockpit de estado operativo** en *Fuentes & Datos*: proveedor LLM activo (vía `/health`) e
  **integridad del feed** con aviso explícito de qué secciones llegan vacías (para que un volcado
  parcial no deje módulos silenciosamente mudos).
- **`api.healthInfo()`**: expone `{ ok, llm, ts }` del backend al frontend.
- **`LLM_TIMEOUT_MS`** (env): timeout configurable de la re-medición (default 30s).

### Cambiado
- **Re-medición LLM endurecida** (`server/index.js`): modelo por defecto `claude-sonnet-4-6`
  → `claude-sonnet-5` (override por `ANTHROPIC_MODEL`/`OPENAI_MODEL`); timeout duro con
  `AbortController`; errores 429/5xx/timeout traducidos a mensaje accionable con status correcto
  (504 en timeout); la respuesta ahora incluye el `model` usado.
- **Detección de marca robusta**: insensible a acentos/mayúsculas y con límites de palabra
  (evita falsos positivos por subcadena; p.ej. "mahoutica" ya no cuenta como "Mahou").
- **Persistencia de la Action Queue a prueba de fallos**: escritura **atómica** (tmp+rename) y
  escrituras **serializadas por cliente** (sin condición de carrera lectura-modificación-escritura).
  Los endpoints POST/PATCH de acciones devuelven errores 500 legibles si falla la persistencia.
- **Documentación sincronizada con la realidad**: corregido el mito de "8 módulos stub" — los 18
  módulos están implementados y leen del feed. README ampliado con la sección de robustez operativa.

### Verificado
- Detección de marca: casos con acento, multi-palabra y falso positivo por subcadena.
- Persistencia: 50 escrituras concurrentes sobre el mismo cliente sin pérdidas.
- Validador: mahou 17/17 secciones; feed parcial y `null` gestionados sin romper.
- Backend real (smoke): `/health`, listado y alta multicliente (config+feed válidos),
  actions seed→create, y re-medición sin API key → 503 legible.
- Build de producción limpio (74 módulos).

### Notas
- El binario nativo de rollup es específico de plataforma: si mueves `node_modules` entre
  macOS y Linux, reinstala (`rm -rf node_modules package-lock.json && npm install`).
- Persistencia en fichero: en Render free el disco es efímero (se reinicia en redeploy).
  Persistencia dura (Postgres/BigQuery) → Fase 2.

## [1.0.0-phase1] — 2026-07-05

Versión inicial. Core config-driven multicliente (un cliente = `config.json` + `feed.json`),
18 módulos leyendo del feed, role-gating, Ciclo GEO con re-medición LLM real, Action Queue
persistente en fichero y alta de cliente. IP de plataforma: Cupperlab. Datos: pipeline Relevant.
