# Deploy de GEO-OS

Dos mitades:
- **Frontend** (build estático) → GitHub Pages. Muestra toda la app.
- **Backend** (Express + persistencia + re-medición LLM) → necesita un host Node (Render/Railway). GitHub Pages **no** puede ejecutarlo.

En GitHub Pages la app corre en **modo degradado**: navegación, 18 módulos, role-gating y datos del feed funcionan; el loop con persistencia y el "Re-mide" real muestran su aviso (necesitan backend). Para el loop en vivo online, usa la opción B.

---

## A · Frontend en TU GitHub Pages (para enseñarlo) — recomendado

Desde `geo-os/`, una sola vez crea el repo en tu GitHub (web: New repository → nombre `geo-os` → público → Create) y conéctalo:

```bash
cd ~/Documents/Claude/Projects/"Mahou Reloaded"/geo-os
git init
git add .
git commit -m "GEO-OS Fase 1"
git branch -M main
git remote add origin https://github.com/jplimongi/geo-os.git
git push -u origin main
```

Publica (build + push a la rama gh-pages, automático):

```bash
npm install
npm run deploy
```

Luego en GitHub: repo **Settings → Pages → Branch: `gh-pages` / root → Save**. En ~1 min tu URL queda en:

```
https://jplimongi.github.io/geo-os/
```

Para actualizar tras cambios: `npm run deploy` otra vez.

> Reutilizar `jplimongi/geo-os-msm` (el mock viejo) también vale, pero lo sobrescribe. Mejor repo nuevo para no perder la demo anterior.

---

## B · App completa (con backend, loop en vivo) — Render

Un solo servicio: el Express ya sirve el `dist/` compilado (mismo origen que la API).

1. Sube el repo a GitHub (pasos de arriba).
2. En **render.com** → New → Web Service → conecta el repo.
   - **Build command:** `npm install && npm run build`
   - **Start command:** `npm run server`
   - **Environment:** `ANTHROPIC_API_KEY = sk-ant-...` (o `OPENAI_API_KEY`)
3. Deploy. Render te da una URL tipo `https://geo-os.onrender.com` con **todo funcionando**: persistencia + re-medición real.

> Nota: en Render el plan free tiene disco efímero — la Action Queue en fichero se reinicia al redeploy. Para persistencia dura, migrar a Postgres/BigQuery (Fase 2).

---

## Límite de esta sesión

El push a GitHub no se puede hacer desde aquí (el conector de GitHub no está autorizado y la sesión es no interactiva). Por eso los comandos de arriba los ejecutas tú desde tu Mac; el proyecto ya está listo para ello (`npm run deploy` incluido).
