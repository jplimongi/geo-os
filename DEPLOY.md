# Deploy de GEO-OS (publicación real, full-stack)

Tras el hardening (v1.3), GEO-OS se publica como **un solo servicio Node en Render** que sirve
la API + la app compilada. El login es real (server-side), los datos de negocio y los secretos
van por API autenticada, y la config se sirve saneada (sin credenciales). **GitHub Pages
(solo-frontend) ya no sirve para producción**: la app necesita el backend para todo.

## A · Publicar en Render (Blueprint, recomendado)

1. Sube el repo a GitHub (una vez):
   ```bash
   cd geo-os
   git add . && git commit -m "GEO-OS hardening + deploy"
   git branch -M main
   git remote add origin https://github.com/<tu-org>/geo-os.git
   git push -u origin main
   ```
   `node_modules`, `dist`, `.env` y **todos los `*-secrets.json` / `*-auth.json`** están en
   `.gitignore` — no se suben.

2. En **render.com → New → Blueprint** → conecta el repo. El [`render.yaml`](render.yaml) define
   build, start, health check, disco persistente y variables. Pulsa **Apply**.

3. Rellena las variables marcadas `sync:false`:
   - `SESSION_SECRET` — la genera Render (firma los tokens de sesión).
   - `APP_ORIGIN` — déjala vacía (mismo origen). Ponla solo si el front va en otro dominio.
   - `DATA_DIR` — ya apunta a `/var/data` (disco persistente): secretos, auth, uso y acciones
     **sobreviven a los redeploys**.
   - `ANTHROPIC_API_KEY` — opcional (fallback global). Lo normal es fijar la key **por cliente**
     desde *Parametrización → Conexiones*.

4. Deploy. Render da una URL tipo `https://geo-os.onrender.com` con todo funcionando.

> **Plan:** el disco persistente requiere plan `starter` o superior. En `free` el disco es
> efímero (secretos/logins se reinician en cada redeploy) — vale para probar, no para operar.

## Primer arranque (importante)

Al arrancar por primera vez, el servidor **siembra los logins** (`<id>-auth.json`) desde las
contraseñas semilla del `config.json` y a partir de ahí manda `auth.json`. Entra con las
credenciales semilla (p.ej. `admin` / `rtcupper2026*`) y **cámbialas** en
*Parametrización → Roles & accesos*: quedan hasheadas server-side y la semilla deja de aplicar.

## Seguridad aplicada (resumen)

- Login server-side con contraseñas **hasheadas** (scrypt); nunca viajan al navegador.
- Todas las rutas `/api/client/:id/*` exigen **token de sesión** válido y del cliente correcto
  (aislamiento entre tenants). `POST /clients` exige admin de plataforma.
- **Secretos** (API keys) y **auth** fuera de git y nunca devueltos por la API (solo estado).
- Feed y config no se sirven como estáticos; CORS restringido; rate-limit en login y re-medición.
- Presupuesto por cliente con modo bloqueo (402 al agotarse).

## B · Local sin terminal

Doble clic en `GEO-OS.command` (arranca API + front y abre el navegador). Ver README.
