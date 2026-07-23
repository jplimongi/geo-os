# HAND-OFF · GEO-OS — estado actual (para retomar en un hilo nuevo)

> Pega este archivo (o su ruta) al abrir el nuevo hilo. Con esto + la carpeta del proyecto
> hay contexto suficiente para seguir. Versión actual: **v1.6.0-phase1**.

## Qué es
Plataforma **GEO-OS** (Vue 3 + Vite + Pinia + Express), multicliente config-driven, para operar
el GEO/LLMO del grupo Mahou San Miguel. Bid Cupperlab × Relevant Traffic. Trabajamos sobre la
app en `geo-os/` — **no regenerar desde cero, iterar sobre lo existente.**

## Está PUBLICADO y operativo
- **URL producción:** https://geo-os-production.up.railway.app
- **Hosting:** Railway (proyecto `amused-upliftment`, servicio `geo-os`, plan HOBBY), full-stack
  (Express sirve API + `dist/`). Auto-deploy en cada push a `main`.
- **Repo:** https://github.com/jplimongi/geo-os (rama **main** = la app; `gh-pages` = mock viejo, ignorar).
- **Volumen persistente** montado en `/data` (env `DATA_DIR=/data`): auth, secretos, acciones y
  uso sobreviven a los redeploys. Env definidas en Railway: `SESSION_SECRET`, `DATA_DIR`,
  `NIXPACKS_INSTALL_CMD=npm install --include=dev`.
- **Login demo:** `admin` / `rtcupper2026*` · `SquadGEO` / `msm2026*` ·
  `marcasuser` / `msmmarcas2026*` · `hosteleriauser` / `msmhost2026*`.

## Flujo de trabajo (IMPORTANTE)
1. Editar código en `geo-os/`.
2. Commit + **`git push`** desde el Mac (el sandbox no tiene credenciales de GitHub).
   `cd ~/Documents/Claude/Projects/"Relevant Traffic - Mahou GEO"/geo-os && git push`
3. Railway auto-despliega (~1-2 min).
4. Para VER cambios en el navegador: **recarga la página entera** (Cmd/Ctrl+R). Navegar por
   hash (#/…) no recarga el bundle.

## Lo hecho hasta hoy
- **v1.0.1–1.3.0:** robustez del loop LLM, contrato de datos + validación, persistencia atómica,
  cockpit de estado (Fuentes & Datos), parametrización in-app, conexiones + coste por cliente,
  y **hardening de seguridad** (login server-side con hash scrypt + token, API protegida con
  aislamiento entre tenants, CORS, rate-limit, config/feed no estáticos, sin fugas en el bundle).
- **v1.4.0 · Formación Fase 1:** onboarding in-app (checklist "Primeros pasos" por rol en la Torre)
  + ayuda contextual (botón `?` → `HelpDrawer`) + glosario GEO/LLMO. Contenido en `src/content/help.js`.
- **v1.5.0 · Formación Fase 2:** **Academia GEO-OS** (reescritura de `Formacion.vue`): 5 rutas por
  rol con lecciones (tarea guiada) + examen + badge "GEO-OS Certified". Contenido en
  `src/content/academy.js`. Verificado end-to-end en producción (examen 5/5, badge emitido).
- **v1.6.0 · Formación Fase 3 (Adopción) + comentarios:** (1) progreso/cert de la Academia ahora
  **persistido en backend por rol** (`<id>-academy.json`), con caché offline y migración del
  progreso local previo; (2) **tracking de uso de módulos** (beacon en el router → contadores
  agregados por rol×módulo en `<id>-adoption.json`); (3) **panel Adopción** (`Adopcion.vue`,
  `/adopcion`, solo acceso total): certificación por rol + módulos infrautilizados; (4)
  **comentarios de mejora post-it** (`CommentsLayer.vue` en `AppShell`): cualquier usuario clava
  notas por módulo (x,y % viewport), arrastrables, resolver/editar/borrar; backend
  `<id>-comments.json`. Build verificado (vite build OK). Nota de diseño: los logins son **por
  rol**, no por persona → toda la analítica de adopción y la autoría de comentarios es por rol.

## PENDIENTE — retomar aquí
1. **Verificar Fase 3 en producción** tras el push: entrar como cada rol, completar/certificar en
   la Academia y confirmar que el admin lo ve en **Adopción**; clavar un comentario y comprobar
   persistencia entre sesiones/roles. (El sandbox no tiene datos reales de uso todavía.)
2. **Operativo (cuando el cliente lo pida):**
   - Cambiar las **contraseñas semilla** desde Parametrización → Roles (las de demo siguen en el
     repo como bootstrap; una vez cambiadas mandan los hashes del volumen).
   - Meter la **API key del LLM** en Parametrización → Conexiones para activar la re-medición real
     del Ciclo GEO (hoy `llm: none`, degradado correcto).
3. **Cosmético menor:** hay una entrada de prueba `ZZVERIFY $0.00` en Costes & Uso (de una
   verificación; es $0, no hay endpoint de borrado, desaparece al cambiar de mes).
4. **Integración de datos (Relevant, fuera de nuestro alcance):** sustituir el `feed.json` por el
   pipeline real (DataForSEO/SE Ranking/Ahrefs/GA4/BigQuery). El contrato está en
   `CONTRATO_DATOS_feed.md`; el core no cambia.

## Arquitectura rápida
`public/clients/<id>/config.json` (identidad/roles, servido saneado) · `feed.json` (datos, solo
vía API autenticada) · `src/stores/client.js` (login/token/role-gating) · `src/modules/registry.js`
(fuente única de módulos) · `server/index.js` (API + auth + secretos + coste). Docs: `README.md`,
`DEPLOY.md`, `CONTRATO_DATOS_feed.md`, `CHANGELOG.md`.

## Estado git
`main` sincronizado con GitHub, working tree limpio. Último commit: `959ce7c` (Fase 2).
