// GEO-OS backend — herramienta en funcionamiento (no demo).
// - Sirve config/feed por cliente (hoy fichero; mañana BigQuery/tabla única de Relevant).
// - Persiste la Action Queue en disco (server/data/<id>-actions.json).
// - Re-mide de verdad consultando un LLM (Anthropic u OpenAI) con tu API key en env.
import express from 'express'
import compression from 'compression'
import cors from 'cors'
import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const CLIENTS = path.join(ROOT, 'public', 'clients')
// DATA_DIR permite apuntar a un disco persistente (Render) para que secretos,
// auth, acciones y uso NO se pierdan en cada redeploy.
const DATA = process.env.DATA_DIR || path.join(__dirname, 'data')
const PORT = process.env.PORT || 3001
// Secreto de firma de sesiones. En prod DEBE venir por env; si falta, se genera
// uno efímero (los tokens dejan de valer al reiniciar → fuerza configurarlo).
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex')
if (!process.env.SESSION_SECRET) console.warn('⚠ SESSION_SECRET no definido: usando uno efímero (define uno en producción).')

const app = express()
// CORS restringido: en prod la app se sirve del mismo origen (no hace falta CORS).
// APP_ORIGIN permite una allowlist separada por comas si el front va aparte.
const ALLOW = (process.env.APP_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean)
app.use(cors(ALLOW.length ? { origin: ALLOW } : { origin: false }))
app.use(compression())
app.use(express.json())

async function readJson(p, fallback = null) {
  try { return JSON.parse(await fs.readFile(p, 'utf8')) } catch { return fallback }
}
// Escritura ATÓMICA: escribe a un tmp y hace rename (atómico en el mismo FS).
// Evita dejar el JSON de la Action Queue a medias/corrupto si el proceso muere
// durante la escritura en uso diario.
async function writeJson(p, obj) {
  await fs.mkdir(path.dirname(p), { recursive: true })
  const tmp = `${p}.${process.pid}.${Date.now()}.tmp`
  await fs.writeFile(tmp, JSON.stringify(obj, null, 2))
  await fs.rename(tmp, p)
}
// Serializa las escrituras por cliente para que dos requests concurrentes no
// pisen el fichero (lectura-modificación-escritura sin condición de carrera).
const writeChains = new Map()
function withWriteLock(id, fn) {
  const prev = writeChains.get(id) || Promise.resolve()
  const next = prev.then(fn, fn)
  writeChains.set(id, next.catch(() => {}))
  return next
}
const actionsPath = (id) => path.join(DATA, `${id}-actions.json`)
const authPath = (id) => path.join(DATA, `${id}-auth.json`)
// Fase 3 · Adopción: progreso/certificación de la Academia y contadores de uso de módulos,
// ambos por ROL (los logins son por rol, no por persona). Ficheros acotados en el volumen.
const academyPath = (id) => path.join(DATA, `${id}-academy.json`)
const adoptionPath = (id) => path.join(DATA, `${id}-adoption.json`)
// Comentarios de mejora (post-its clavados por módulo): feedback colaborativo de Relevant/MSM.
const commentsPath = (id) => path.join(DATA, `${id}-comments.json`)

// ---------- AUTENTICACIÓN ----------
// Hash de contraseña con scrypt (nativo, sin dependencias). Formato "salt:hash".
function hashPassword(pass) {
  const salt = crypto.randomBytes(16).toString('hex')
  const h = crypto.scryptSync(String(pass), salt, 64).toString('hex')
  return `${salt}:${h}`
}
function verifyPassword(pass, stored) {
  if (!stored) return String(pass) === '' // rol sin contraseña
  const [salt, h] = stored.split(':')
  if (!salt || !h) return false
  const cand = crypto.scryptSync(String(pass), salt, 64)
  const ref = Buffer.from(h, 'hex')
  return ref.length === cand.length && crypto.timingSafeEqual(ref, cand)
}
// Token de sesión firmado (HMAC), sin estado. payload={cid,roleId,exp}.
function signToken(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(body).digest('base64url')
  return `${body}.${sig}`
}
function verifyToken(token) {
  if (!token || !token.includes('.')) return null
  const [body, sig] = token.split('.')
  const exp = crypto.createHmac('sha256', SESSION_SECRET).update(body).digest('base64url')
  if (sig.length !== exp.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(exp))) return null
  try {
    const p = JSON.parse(Buffer.from(body, 'base64url').toString())
    if (p.exp && Date.now() > p.exp) return null
    return p
  } catch { return null }
}
// Siembra los hashes de login desde las passwords semilla del config, SOLO si aún no
// existe auth.json. NO reescribe el config (así un deploy nuevo puede re-sembrar).
// Las passwords del config nunca se sirven al navegador (ver /api/client/:id/public
// y el bloqueo estático de config.json más abajo). Una vez el admin cambia la
// contraseña en Parametrización, auth.json manda y la semilla del config es irrelevante.
async function migrateAuth(id) {
  if (await readJson(authPath(id))) return
  const cfg = await readJson(path.join(CLIENTS, id, 'config.json'))
  if (!cfg) return
  const auth = {}
  for (const r of cfg.roles || []) auth[r.id] = { user: r.credential?.user || r.id, hash: hashPassword(r.credential?.pass ?? '') }
  await writeJson(authPath(id), auth)
}
// Config saneada para el navegador. keepUser=false → sin credenciales (pre-login);
// keepUser=true → conserva el usuario pero NUNCA la contraseña (paneles de admin).
function sanitizeConfig(cfg, keepUser = false) {
  if (!cfg) return cfg
  return {
    ...cfg,
    roles: (cfg.roles || []).map(({ credential, ...r }) =>
      keepUser ? { ...r, credential: { user: credential?.user } } : r)
  }
}

// ¿El rol del token tiene acceso total? platform_admin o sees:'all' en el config.
// Se resuelve server-side (el token no lleva `sees`) para gatear paneles de admin.
async function roleHasFullAccess(id, roleId, platformAdmin) {
  if (platformAdmin) return true
  const cfg = await readJson(path.join(CLIENTS, id, 'config.json'))
  return (cfg?.roles || []).find(r => r.id === roleId)?.sees === 'all'
}

// Middleware: exige token válido cuyo cid coincida con el cliente de la ruta.
function requireAuth(req, res, res_next) {
  const h = req.headers.authorization || ''
  const token = h.startsWith('Bearer ') ? h.slice(7) : null
  const p = verifyToken(token)
  if (!p) return res.status(401).json({ error: 'No autenticado' })
  if (req.params.id && p.cid !== req.params.id) return res.status(403).json({ error: 'Token de otro cliente' })
  req.auth = p
  res_next()
}

// Rate-limit en memoria (por IP+clave). Evita fuerza bruta de login y abuso de coste.
const rlBuckets = new Map()
function rateLimit(key, max, windowMs) {
  const now = Date.now()
  const b = rlBuckets.get(key) || { n: 0, reset: now + windowMs }
  if (now > b.reset) { b.n = 0; b.reset = now + windowMs }
  b.n++; rlBuckets.set(key, b)
  return b.n <= max
}

app.get('/api/health', (req, res) =>
  res.json({ ok: true, llm: llmProvider() || 'none', ts: new Date().toISOString() }))

// LOGIN: verifica user/pass contra los hashes server-side y emite token de sesión.
app.post('/api/client/:id/login', async (req, res) => {
  const id = req.params.id
  const ip = req.ip || req.socket?.remoteAddress || 'x'
  if (!rateLimit(`login:${ip}:${id}`, 10, 5 * 60 * 1000))
    return res.status(429).json({ error: 'Demasiados intentos. Espera unos minutos.' })
  const { user, pass } = req.body || {}
  const auth = await readJson(authPath(id))
  const cfg = await readJson(path.join(CLIENTS, id, 'config.json'))
  if (!auth || !cfg) return res.status(404).json({ error: 'Cliente no encontrado' })
  const entry = Object.entries(auth).find(([, v]) => (v.user || '').toLowerCase() === (user || '').toLowerCase())
  if (!entry || !verifyPassword(pass ?? '', entry[1].hash))
    return res.status(401).json({ error: 'Usuario o contraseña incorrectos' })
  const role = (cfg.roles || []).find(r => r.id === entry[0])
  if (!role) return res.status(403).json({ error: 'Rol sin definición en config' })
  const token = signToken({ cid: id, roleId: role.id, platform_admin: role.platform_admin === true, exp: Date.now() + 12 * 3600 * 1000 })
  const { credential, ...safeRole } = role  // no devolver credenciales al navegador
  res.json({ token, role: safeRole })
})

// Config PÚBLICA saneada (sin credenciales): la usa el login para tema/identidad.
app.get('/api/client/:id/public', async (req, res) => {
  const cfg = await readJson(path.join(CLIENTS, req.params.id, 'config.json'))
  cfg ? res.json(sanitizeConfig(cfg)) : res.status(404).json({ error: 'cliente no encontrado' })
})

// Config completa (autenticada): con usuarios pero SIN contraseñas.
app.get('/api/client/:id/config', requireAuth, async (req, res) => {
  const cfg = await readJson(path.join(CLIENTS, req.params.id, 'config.json'))
  cfg ? res.json(sanitizeConfig(cfg, true)) : res.status(404).json({ error: 'config no encontrada' })
})

// Edición de parametrización desde la UI (sin tocar JSON ni terminal).
// Persiste la config completa de un cliente EXISTENTE con escritura atómica.
app.put('/api/client/:id/config', requireAuth, async (req, res) => {
  const id = req.params.id
  const cfg = req.body?.config
  const cfgPath = path.join(CLIENTS, id, 'config.json')
  if (!cfg || typeof cfg !== 'object') return res.status(400).json({ error: 'falta config' })
  if (!(await readJson(cfgPath))) return res.status(404).json({ error: `El cliente “${id}” no existe` })
  // client_id es inmutable: siempre el de la ruta.
  cfg.client_id = id
  // Validaciones mínimas para no romper el login/role-gating.
  const roles = Array.isArray(cfg.roles) ? cfg.roles : []
  if (!roles.length) return res.status(400).json({ error: 'Debe haber al menos un rol' })
  if (!roles.some(r => r.platform_admin === true || r.sees === 'all'))
    return res.status(400).json({ error: 'Debe existir al menos un rol con acceso total (admin)' })
  for (const r of roles) {
    if (!r.id || !r.credential?.user) return res.status(400).json({ error: 'Cada rol necesita id y usuario' })
  }
  try {
    // Sincroniza credenciales a auth.json (hash) y quita las passwords del config servido.
    const auth = await readJson(authPath(id), {})
    for (const r of roles) {
      const cur = auth[r.id] || {}
      cur.user = r.credential.user
      if (typeof r.credential.pass === 'string' && r.credential.pass !== '') cur.hash = hashPassword(r.credential.pass)
      else if (!cur.hash) cur.hash = hashPassword('')  // rol nuevo sin contraseña
      auth[r.id] = cur
      delete r.credential.pass  // nunca en el config
    }
    for (const rid of Object.keys(auth)) if (!roles.find(r => r.id === rid)) delete auth[rid]  // roles borrados
    await withWriteLock(`sec-${id}`, () => writeJson(authPath(id), auth))
    await withWriteLock(`cfg-${id}`, () => writeJson(cfgPath, cfg))
    res.json({ ok: true, config: cfg })
  } catch (e) { res.status(500).json({ error: 'No se pudo guardar la config: ' + e.message }) }
})

app.get('/api/client/:id/feed', requireAuth, async (req, res) => {
  const feed = await readJson(path.join(CLIENTS, req.params.id, 'feed.json'))
  feed ? res.json(feed) : res.status(404).json({ error: 'feed no encontrado' })
})

// Merge parcial del feed (p.ej. prompts monitorizados que curan los operadores).
// Sólo mezcla las claves enviadas; el resto del feed (que llena el pipeline) queda intacto.
app.patch('/api/client/:id/feed', requireAuth, async (req, res) => {
  const id = req.params.id
  const patch = req.body?.patch
  const feedPath = path.join(CLIENTS, id, 'feed.json')
  if (!patch || typeof patch !== 'object') return res.status(400).json({ error: 'falta patch' })
  try {
    const merged = await withWriteLock(`feed-${id}`, async () => {
      const feed = await readJson(feedPath)
      if (!feed) return null
      const next = { ...feed, ...patch }
      await writeJson(feedPath, next)
      return next
    })
    if (!merged) return res.status(404).json({ error: `feed de “${id}” no encontrado` })
    res.json({ ok: true, feed: merged })
  } catch (e) { res.status(500).json({ error: 'No se pudo actualizar el feed: ' + e.message }) }
})

// --- Gestión de clientes (alta / listado) ---
app.get('/api/clients', requireAuth, async (req, res) => {
  try {
    const dirs = await fs.readdir(CLIENTS, { withFileTypes: true })
    const list = []
    for (const d of dirs) {
      if (!d.isDirectory()) continue
      const cfg = await readJson(path.join(CLIENTS, d.name, 'config.json'), {})
      list.push({ id: d.name, name: cfg?.brand?.name || d.name })
    }
    res.json(list)
  } catch { res.json([]) }
})

app.post('/api/clients', requireAuth, async (req, res) => {
  if (!req.auth?.platform_admin) return res.status(403).json({ error: 'Solo un admin de plataforma puede crear clientes' })
  const cfg = req.body?.config
  const id = cfg?.client_id
  if (!id || !/^[a-z0-9-]+$/.test(id))
    return res.status(400).json({ error: 'client_id inválido (usa minúsculas, números y guiones)' })
  const dir = path.join(CLIENTS, id)
  if (await readJson(path.join(dir, 'config.json')))
    return res.status(409).json({ error: `El cliente “${id}” ya existe` })
  await writeJson(path.join(dir, 'config.json'), cfg)
  await migrateAuth(id)  // hashea credenciales del nuevo cliente y las quita del config servido
  // feed inicial vacío pero válido (estados = pendiente; se llena con el pipeline de Relevant)
  await writeJson(path.join(dir, 'feed.json'), {
    client_id: id, period: new Date().toISOString().slice(0, 7),
    as_of: new Date().toISOString().slice(0, 10),
    source: 'Alta recién creada · pendiente de volcado del pipeline',
    kpis: [], visibility_by_engine: { labels: [], brand: [] },
    brand_vs_link: [], authority: [], prompts_bank: [], competitors: [],
    alerts: [], actions: []
  })
  res.status(201).json({ ok: true, id })
})

// Action Queue persistente. Se siembra del feed la primera vez.
app.get('/api/client/:id/actions', requireAuth, async (req, res) => {
  const id = req.params.id
  let actions = await readJson(actionsPath(id))
  if (!actions) {
    actions = await withWriteLock(id, async () => {
      const existing = await readJson(actionsPath(id))
      if (existing) return existing
      const feed = await readJson(path.join(CLIENTS, id, 'feed.json'), {})
      const seeded = (feed.actions || []).map((a, i) => ({ id: `seed-${i}`, ...a }))
      await writeJson(actionsPath(id), seeded)
      return seeded
    })
  }
  res.json(actions)
})

app.post('/api/client/:id/actions', requireAuth, async (req, res) => {
  const id = req.params.id
  try {
    const result = await withWriteLock(id, async () => {
      const actions = await readJson(actionsPath(id), [])
      const exists = actions.find(a => a.origin === req.body.origin && a.title === req.body.title)
      if (exists) return { code: 200, body: exists }
      const action = { id: `a-${Date.now()}`, status: 'pendiente', created: new Date().toISOString(), ...req.body }
      actions.unshift(action)
      await writeJson(actionsPath(id), actions)
      return { code: 201, body: action }
    })
    res.status(result.code).json(result.body)
  } catch (e) { res.status(500).json({ error: 'No se pudo persistir la acción: ' + e.message }) }
})

app.patch('/api/client/:id/actions/:aid', requireAuth, async (req, res) => {
  const id = req.params.id
  try {
    const result = await withWriteLock(id, async () => {
      const actions = await readJson(actionsPath(id), [])
      const a = actions.find(x => x.id === req.params.aid)
      if (!a) return { code: 404, body: { error: 'acción no encontrada' } }
      Object.assign(a, req.body)
      await writeJson(actionsPath(id), actions)
      return { code: 200, body: a }
    })
    res.status(result.code).json(result.body)
  } catch (e) { res.status(500).json({ error: 'No se pudo actualizar la acción: ' + e.message }) }
})

// ---------- FASE 3 · ADOPCIÓN ----------
// Progreso/certificación de la Academia, persistido por ROL en el volumen. La identidad
// la deriva el server del token (roleId): no se puede falsear desde el cliente.
// Estructura del fichero: { [roleId]: { paths: { [pathId]: {done:[], cert:{score,date}} }, updated } }

// Mi propio progreso (para hidratar la Academia al entrar).
app.get('/api/client/:id/academy', requireAuth, async (req, res) => {
  const all = await readJson(academyPath(req.params.id), {})
  res.json(all[req.auth.roleId] || { paths: {} })
})

// Guarda MI progreso (el del rol del token). Reemplaza el bloque de este rol.
app.put('/api/client/:id/academy', requireAuth, async (req, res) => {
  const id = req.params.id
  const paths = req.body?.paths
  if (!paths || typeof paths !== 'object') return res.status(400).json({ error: 'falta paths' })
  try {
    const saved = await withWriteLock(`academy-${id}`, async () => {
      const all = await readJson(academyPath(id), {})
      all[req.auth.roleId] = { paths, updated: new Date().toISOString() }
      await writeJson(academyPath(id), all)
      return all[req.auth.roleId]
    })
    res.json({ ok: true, progress: saved })
  } catch (e) { res.status(500).json({ error: 'No se pudo guardar el progreso: ' + e.message }) }
})

// Beacon de uso de módulos: incrementa un contador agregado por rol×módulo (sin log de eventos,
// sin PII). moduleId saneado y acotado; el nº de módulos es fijo → el fichero queda pequeño.
// Estructura: { [roleId]: { [moduleId]: { count, last } } }
app.post('/api/client/:id/track', requireAuth, async (req, res) => {
  const id = req.params.id
  const mid = String(req.body?.moduleId || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40)
  if (!mid) return res.status(400).json({ error: 'falta moduleId' })
  try {
    await withWriteLock(`adoption-${id}`, async () => {
      const all = await readJson(adoptionPath(id), {})
      const role = all[req.auth.roleId] || (all[req.auth.roleId] = {})
      const cell = role[mid] || (role[mid] = { count: 0, last: null })
      cell.count++; cell.last = new Date().toISOString()
      await writeJson(adoptionPath(id), all)
    })
    res.status(204).end()
  } catch (e) { res.status(500).json({ error: 'No se pudo registrar el uso: ' + e.message }) }
})

// Panel de Adopción (solo acceso total): certificación por rol + uso de módulos por rol.
// Devuelve también los roles del config para pintar filas aunque no tengan datos aún.
app.get('/api/client/:id/adoption', requireAuth, async (req, res) => {
  const id = req.params.id
  if (!(await roleHasFullAccess(id, req.auth.roleId, req.auth.platform_admin)))
    return res.status(403).json({ error: 'Requiere acceso total' })
  const cfg = await readJson(path.join(CLIENTS, id, 'config.json'), {})
  const roles = (cfg.roles || []).map(r => ({ id: r.id, user: r.credential?.user || r.id, label: r.label || r.id, sees: r.sees }))
  res.json({
    generated: new Date().toISOString(), roles,
    academy: await readJson(academyPath(id), {}),
    modules: await readJson(adoptionPath(id), {})
  })
})

// ---------- COMENTARIOS DE MEJORA (post-its) ----------
// Notas ancladas a un módulo y una posición (x,y en % del área de contenido). Cualquier
// usuario logueado deja/ve; autor o acceso total resuelve/borra. Estructura: array de
// { id, module, x, y, text, author:{role,label}, status:'open'|'resolved', created, resolved_by }
app.get('/api/client/:id/comments', requireAuth, async (req, res) => {
  const all = await readJson(commentsPath(req.params.id), [])
  res.json(req.query.module ? all.filter(c => c.module === req.query.module) : all)
})

app.post('/api/client/:id/comments', requireAuth, async (req, res) => {
  const id = req.params.id
  const { module, x, y, text } = req.body || {}
  if (!module || typeof text !== 'string' || !text.trim()) return res.status(400).json({ error: 'faltan module y text' })
  const cfg = await readJson(path.join(CLIENTS, id, 'config.json'), {})
  const label = (cfg.roles || []).find(r => r.id === req.auth.roleId)?.label || req.auth.roleId
  try {
    const c = await withWriteLock(`comments-${id}`, async () => {
      const all = await readJson(commentsPath(id), [])
      const item = {
        id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        module: String(module).slice(0, 40),
        x: clampPct(x), y: clampPct(y),
        text: String(text).slice(0, 2000),
        author: { role: req.auth.roleId, label },
        status: 'open', created: new Date().toISOString()
      }
      all.unshift(item)
      await writeJson(commentsPath(id), all)
      return item
    })
    res.status(201).json(c)
  } catch (e) { res.status(500).json({ error: 'No se pudo guardar el comentario: ' + e.message }) }
})

app.patch('/api/client/:id/comments/:cid', requireAuth, async (req, res) => {
  const id = req.params.id
  try {
    const result = await withWriteLock(`comments-${id}`, async () => {
      const all = await readJson(commentsPath(id), [])
      const c = all.find(x => x.id === req.params.cid)
      if (!c) return { code: 404, body: { error: 'comentario no encontrado' } }
      const b = req.body || {}
      const isOwner = c.author?.role === req.auth.roleId
      const full = await roleHasFullAccess(id, req.auth.roleId, req.auth.platform_admin)
      if (b.x != null) c.x = clampPct(b.x)                       // reposicionar (arrastrar): cualquiera
      if (b.y != null) c.y = clampPct(b.y)
      if (b.status === 'open' || b.status === 'resolved') {       // resolver/reabrir: cualquiera, se registra quién
        c.status = b.status
        c.resolved_by = b.status === 'resolved' ? (c.author?.label && isOwner ? c.author.label : req.auth.roleId) : null
      }
      if (typeof b.text === 'string') {                           // editar texto: solo autor o acceso total
        if (!isOwner && !full) return { code: 403, body: { error: 'Solo el autor o un admin puede editar el texto' } }
        c.text = b.text.slice(0, 2000)
      }
      await writeJson(commentsPath(id), all)
      return { code: 200, body: c }
    })
    res.status(result.code).json(result.body)
  } catch (e) { res.status(500).json({ error: 'No se pudo actualizar el comentario: ' + e.message }) }
})

app.delete('/api/client/:id/comments/:cid', requireAuth, async (req, res) => {
  const id = req.params.id
  try {
    const result = await withWriteLock(`comments-${id}`, async () => {
      const all = await readJson(commentsPath(id), [])
      const c = all.find(x => x.id === req.params.cid)
      if (!c) return { code: 404, body: { error: 'comentario no encontrado' } }
      const full = await roleHasFullAccess(id, req.auth.roleId, req.auth.platform_admin)
      if (c.author?.role !== req.auth.roleId && !full) return { code: 403, body: { error: 'Solo el autor o un admin puede borrar' } }
      await writeJson(commentsPath(id), all.filter(x => x.id !== req.params.cid))
      return { code: 200, body: { ok: true } }
    })
    res.status(result.code).json(result.body)
  } catch (e) { res.status(500).json({ error: 'No se pudo borrar el comentario: ' + e.message }) }
})
// Acota una coordenada a [0,100] (% del área de contenido); tolera basura → 50.
function clampPct(v) { const n = Number(v); return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 50 }

// RE-MEDICIÓN REAL: pregunta al LLM el prompt y detecta si la marca es citada/mencionada.
// Usa la credencial LLM DEL CLIENTE, controla su presupuesto y registra el coste real.
app.post('/api/client/:id/remeasure', requireAuth, async (req, res) => {
  const id = req.params.id
  if (!rateLimit(`remeasure:${id}`, 30, 60 * 1000))
    return res.status(429).json({ error: 'Límite de re-mediciones por minuto alcanzado. Reintenta en un momento.' })
  const { prompt, brand } = req.body || {}
  if (!prompt || !brand) return res.status(400).json({ error: 'faltan prompt y brand' })
  const cred = await resolveLLM(id)
  if (!cred) return res.status(503).json({
    error: 'Sin API key para este cliente. Configúrala en Conexiones (o exporta ANTHROPIC/OPENAI_API_KEY).'
  })
  // Control de presupuesto por cliente.
  const cfg = await readJson(path.join(CLIENTS, id, 'config.json'), {})
  const budget = cfg.cost_control || {}
  const period = monthOf()
  const spent = await monthSpend(id, period)
  if (budget.mode === 'block' && budget.budget_usd_month > 0 && spent >= budget.budget_usd_month) {
    return res.status(402).json({
      error: `Presupuesto mensual agotado (${spent.toFixed(2)}/${budget.budget_usd_month} USD). Sube el límite en Costes & Uso o cambia el modo a aviso.`,
      budget_exceeded: true, spent, budget: budget.budget_usd_month
    })
  }
  try {
    const { answer, model, usage } = await askLLM(cred, prompt)
    const pricing = await getPricing()
    const cost_usd = await costOf(model, usage, pricing)
    await appendUsage(id, {
      ts: new Date().toISOString(), kind: 'llm', provider: cred.provider, model,
      in_tokens: usage.in_tokens, out_tokens: usage.out_tokens, cost_usd, prompt: prompt.slice(0, 80)
    })
    const spentAfter = spent + cost_usd
    res.json({
      engine: cred.provider, model, key_source: cred.source, prompt, brand,
      mentioned: brandMentioned(answer, brand), cited: brandMentioned(answer, brand),
      answer_excerpt: answer.slice(0, 600), usage, cost_usd,
      budget: budget.budget_usd_month || null, spent_month: +spentAfter.toFixed(4),
      budget_warn: budget.budget_usd_month > 0 && spentAfter >= budget.budget_usd_month,
      measured_at: new Date().toISOString(), state: 'real'
    })
  } catch (e) {
    const status = e.name === 'AbortError' ? 504 : (e.httpStatus || 502)
    res.status(status).json({ error: 'Fallo al consultar el LLM: ' + e.message })
  }
})

// --- CONEXIONES: estado (nunca devuelve llaves) + set de credenciales (write-only) ---
app.get('/api/client/:id/connections', requireAuth, async (req, res) => {
  const id = req.params.id
  const s = await readJson(secretsPath(id), {})
  const cred = await resolveLLM(id)
  const providers = {}
  for (const [name, v] of Object.entries(s.providers || {})) providers[name] = { configured: !!v?.key, updated: v?.updated || null }
  res.json({
    llm: { configured: !!cred, source: cred?.source || 'none', provider: cred?.provider || null, model: cred?.model || null },
    providers
  })
})

app.put('/api/client/:id/connections/llm', requireAuth, async (req, res) => {
  const id = req.params.id
  const { provider, key, model } = req.body || {}
  if (provider && !['anthropic', 'openai'].includes(provider))
    return res.status(400).json({ error: 'provider debe ser anthropic u openai' })
  try {
    await withWriteLock(`sec-${id}`, async () => {
      const s = await readJson(secretsPath(id), {})
      if (key === '' || key == null) { delete s.llm } // vaciar = borrar credencial del cliente
      else s.llm = { provider: provider || 'anthropic', key, model: model || undefined, updated: new Date().toISOString() }
      await writeJson(secretsPath(id), s)
    })
    const cred = await resolveLLM(id)  // devuelve SOLO estado, nunca la llave
    res.json({ ok: true, llm: { configured: !!cred, source: cred?.source || 'none', provider: cred?.provider || null, model: cred?.model || null } })
  } catch (e) { res.status(500).json({ error: 'No se pudo guardar la credencial: ' + e.message }) }
})

app.put('/api/client/:id/connections/provider/:name', requireAuth, async (req, res) => {
  const id = req.params.id, name = req.params.name
  const { key } = req.body || {}
  try {
    await withWriteLock(`sec-${id}`, async () => {
      const s = await readJson(secretsPath(id), {})
      s.providers = s.providers || {}
      if (key === '' || key == null) delete s.providers[name]
      else s.providers[name] = { key, updated: new Date().toISOString() }
      await writeJson(secretsPath(id), s)
    })
    res.json({ ok: true, provider: name, configured: !(req.body?.key === '' || req.body?.key == null) })
  } catch (e) { res.status(500).json({ error: 'No se pudo guardar la credencial: ' + e.message }) }
})

// --- USO & COSTE por cliente ---
app.get('/api/client/:id/usage', requireAuth, async (req, res) => {
  const id = req.params.id
  const period = req.query.period || monthOf()
  const log = await readJson(usagePath(id), [])
  const rows = log.filter(e => monthOf(e.ts) === period)
  const byProvider = {}, byModel = {}
  let total = 0, calls = 0
  for (const e of rows) {
    total += e.cost_usd || 0; calls++
    byProvider[e.provider || e.kind] = +(((byProvider[e.provider || e.kind] || 0) + (e.cost_usd || 0))).toFixed(4)
    if (e.model) byModel[e.model] = +(((byModel[e.model] || 0) + (e.cost_usd || 0))).toFixed(4)
  }
  const cfg = await readJson(path.join(CLIENTS, id, 'config.json'), {})
  res.json({
    period, total_usd: +total.toFixed(4), calls, by_provider: byProvider, by_model: byModel,
    budget: cfg.cost_control || { budget_usd_month: 0, mode: 'alert' },
    recent: rows.slice(0, 20)
  })
})

// Ingesta de uso externo (proveedores de datos que llama el pipeline, o entrada manual).
app.post('/api/client/:id/usage', requireAuth, async (req, res) => {
  const id = req.params.id
  const { provider, cost_usd, units, note, kind } = req.body || {}
  if (!provider || cost_usd == null) return res.status(400).json({ error: 'faltan provider y cost_usd' })
  const entry = await appendUsage(id, {
    ts: new Date().toISOString(), kind: kind || 'data', provider,
    cost_usd: Number(cost_usd), units: units || null, note: note || null
  })
  res.status(201).json({ ok: true, entry })
})

app.get('/api/pricing', async (req, res) => res.json(await getPricing()))
app.put('/api/pricing', requireAuth, async (req, res) => {
  const pricing = req.body?.pricing
  if (!pricing || typeof pricing !== 'object') return res.status(400).json({ error: 'falta pricing' })
  try { await withWriteLock('pricing', () => writeJson(pricingPath(), pricing)); res.json({ ok: true, pricing: await getPricing() }) }
  catch (e) { res.status(500).json({ error: e.message }) }
})

// Detección de marca robusta: insensible a acentos/mayúsculas y con límites de palabra
// (evita falsos positivos por subcadenas). "Mahou" no matchea dentro de otra palabra.
function brandMentioned(text, brand) {
  const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  const t = norm(text)
  const b = norm(brand).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(^|[^a-z0-9])${b}([^a-z0-9]|$)`, 'i').test(t)
}

function llmProvider() {
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic'
  if (process.env.OPENAI_API_KEY) return 'openai'
  return null
}

const LLM_TIMEOUT_MS = Number(process.env.LLM_TIMEOUT_MS) || 30000

// Consulta al LLM con timeout duro. Recibe credencial (provider/key/model) — resuelta
// por cliente. Devuelve { answer, model, usage:{in_tokens,out_tokens} } para medir coste.
// Lanza errores legibles con httpStatus (429/5xx/timeout accionables).
async function askLLM({ provider, key, model }, prompt) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), LLM_TIMEOUT_MS)
  try {
    if (provider === 'anthropic') {
      const mdl = model || 'claude-sonnet-5'
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        signal: ctrl.signal,
        headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
        body: JSON.stringify({ model: mdl, max_tokens: 700, messages: [{ role: 'user', content: prompt }] })
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { const e = new Error(j.error?.message || `HTTP ${r.status}`); e.httpStatus = r.status; throw e }
      return {
        answer: (j.content || []).map(c => c.text).join('\n'), model: mdl,
        usage: { in_tokens: j.usage?.input_tokens || 0, out_tokens: j.usage?.output_tokens || 0 }
      }
    }
    // openai
    const mdl = model || 'gpt-4o-mini'
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      signal: ctrl.signal,
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify({ model: mdl, messages: [{ role: 'user', content: prompt }] })
    })
    const j = await r.json().catch(() => ({}))
    if (!r.ok) { const e = new Error(j.error?.message || `HTTP ${r.status}`); e.httpStatus = r.status; throw e }
    return {
      answer: j.choices?.[0]?.message?.content || '', model: mdl,
      usage: { in_tokens: j.usage?.prompt_tokens || 0, out_tokens: j.usage?.completion_tokens || 0 }
    }
  } catch (e) {
    if (e.name === 'AbortError') throw new Error(`timeout tras ${LLM_TIMEOUT_MS} ms`)
    throw e
  } finally {
    clearTimeout(timer)
  }
}

// --- Secretos por cliente (fuera de git) + resolución de credencial LLM ---
const secretsPath = (id) => path.join(DATA, `${id}-secrets.json`)
const usagePath = (id) => path.join(DATA, `${id}-usage.json`)
const pricingPath = () => path.join(DATA, 'pricing.json')

// Precios por defecto (USD por 1M tokens). EDITABLES desde la UI y verificables.
const DEFAULT_PRICING = {
  'claude-sonnet-5': { in: 3, out: 15 },
  'claude-opus-4-8': { in: 15, out: 75 },
  'claude-haiku-4-5': { in: 1, out: 5 },
  'gpt-4o-mini': { in: 0.15, out: 0.6 },
  'gpt-4o': { in: 2.5, out: 10 }
}
async function getPricing() { return { ...DEFAULT_PRICING, ...(await readJson(pricingPath(), {})) } }

// Resuelve la credencial LLM del cliente (secreto) con fallback a env del servidor.
async function resolveLLM(id) {
  const s = await readJson(secretsPath(id), {})
  if (s.llm?.key) return { provider: s.llm.provider || 'anthropic', key: s.llm.key, model: s.llm.model, source: 'client' }
  if (process.env.ANTHROPIC_API_KEY) return { provider: 'anthropic', key: process.env.ANTHROPIC_API_KEY, model: process.env.ANTHROPIC_MODEL, source: 'env' }
  if (process.env.OPENAI_API_KEY) return { provider: 'openai', key: process.env.OPENAI_API_KEY, model: process.env.OPENAI_MODEL, source: 'env' }
  return null
}

async function costOf(model, usage, pricing) {
  const p = pricing[model] || { in: 0, out: 0 }
  return +((usage.in_tokens / 1e6) * p.in + (usage.out_tokens / 1e6) * p.out).toFixed(6)
}
const monthOf = (iso) => (iso || new Date().toISOString()).slice(0, 7)
async function appendUsage(id, entry) {
  return withWriteLock(`usage-${id}`, async () => {
    const log = await readJson(usagePath(id), [])
    log.unshift(entry)
    await writeJson(usagePath(id), log)
    return entry
  })
}
async function monthSpend(id, period) {
  const log = await readJson(usagePath(id), [])
  return log.filter(e => monthOf(e.ts) === period).reduce((s, e) => s + (e.cost_usd || 0), 0)
}

// Feed y config NO se sirven como estáticos (feed=dato de negocio; config=lleva credenciales
// semilla). Se acceden por API: feed autenticado, config saneada vía /api/client/:id/public.
app.get(/^\/clients\/.+\/(feed|config)\.json$/, (req, res) => res.status(401).json({ error: 'Disponible solo vía API' }))

// Sirve el frontend compilado (mismo origen que la API) -> deploy full-stack en un solo servicio.
app.use(express.static(path.join(ROOT, 'dist')))

// Arranque: migra credenciales en claro a hashes (y las quita del config servido) antes de escuchar.
async function bootstrap() {
  try {
    const dirs = await fs.readdir(CLIENTS, { withFileTypes: true })
    for (const d of dirs) if (d.isDirectory()) await migrateAuth(d.name)
  } catch (e) { console.warn('migrateAuth:', e.message) }
  app.listen(PORT, () => console.log(`GEO-OS en http://localhost:${PORT} · DATA=${DATA} · LLM env: ${llmProvider() || 'ninguno'}`))
}
bootstrap()
