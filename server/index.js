// GEO-OS backend — herramienta en funcionamiento (no demo).
// - Sirve config/feed por cliente (hoy fichero; mañana BigQuery/tabla única de Relevant).
// - Persiste la Action Queue en disco (server/data/<id>-actions.json).
// - Re-mide de verdad consultando un LLM (Anthropic u OpenAI) con tu API key en env.
import express from 'express'
import compression from 'compression'
import cors from 'cors'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const CLIENTS = path.join(ROOT, 'public', 'clients')
const DATA = path.join(__dirname, 'data')
const PORT = process.env.PORT || 3001

const app = express()
app.use(cors())
app.use(compression())
app.use(express.json())

async function readJson(p, fallback = null) {
  try { return JSON.parse(await fs.readFile(p, 'utf8')) } catch { return fallback }
}
async function writeJson(p, obj) {
  await fs.mkdir(path.dirname(p), { recursive: true })
  await fs.writeFile(p, JSON.stringify(obj, null, 2))
}
const actionsPath = (id) => path.join(DATA, `${id}-actions.json`)

app.get('/api/health', (req, res) =>
  res.json({ ok: true, llm: llmProvider() || 'none', ts: new Date().toISOString() }))

app.get('/api/client/:id/config', async (req, res) => {
  const cfg = await readJson(path.join(CLIENTS, req.params.id, 'config.json'))
  cfg ? res.json(cfg) : res.status(404).json({ error: 'config no encontrada' })
})

app.get('/api/client/:id/feed', async (req, res) => {
  const feed = await readJson(path.join(CLIENTS, req.params.id, 'feed.json'))
  feed ? res.json(feed) : res.status(404).json({ error: 'feed no encontrado' })
})

// --- Gestión de clientes (alta / listado) ---
app.get('/api/clients', async (req, res) => {
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

app.post('/api/clients', async (req, res) => {
  const cfg = req.body?.config
  const id = cfg?.client_id
  if (!id || !/^[a-z0-9-]+$/.test(id))
    return res.status(400).json({ error: 'client_id inválido (usa minúsculas, números y guiones)' })
  const dir = path.join(CLIENTS, id)
  if (await readJson(path.join(dir, 'config.json')))
    return res.status(409).json({ error: `El cliente “${id}” ya existe` })
  await writeJson(path.join(dir, 'config.json'), cfg)
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
app.get('/api/client/:id/actions', async (req, res) => {
  let actions = await readJson(actionsPath(req.params.id))
  if (!actions) {
    const feed = await readJson(path.join(CLIENTS, req.params.id, 'feed.json'), {})
    actions = (feed.actions || []).map((a, i) => ({ id: `seed-${i}`, ...a }))
    await writeJson(actionsPath(req.params.id), actions)
  }
  res.json(actions)
})

app.post('/api/client/:id/actions', async (req, res) => {
  const actions = await readJson(actionsPath(req.params.id), [])
  const exists = actions.find(a => a.origin === req.body.origin && a.title === req.body.title)
  if (exists) return res.json(exists)
  const action = { id: `a-${Date.now()}`, status: 'pendiente', created: new Date().toISOString(), ...req.body }
  actions.unshift(action)
  await writeJson(actionsPath(req.params.id), actions)
  res.status(201).json(action)
})

app.patch('/api/client/:id/actions/:aid', async (req, res) => {
  const actions = await readJson(actionsPath(req.params.id), [])
  const a = actions.find(x => x.id === req.params.aid)
  if (!a) return res.status(404).json({ error: 'acción no encontrada' })
  Object.assign(a, req.body)
  await writeJson(actionsPath(req.params.id), actions)
  res.json(a)
})

// RE-MEDICIÓN REAL: pregunta al LLM el prompt y detecta si la marca es citada/mencionada.
app.post('/api/client/:id/remeasure', async (req, res) => {
  const { prompt, brand } = req.body || {}
  if (!prompt || !brand) return res.status(400).json({ error: 'faltan prompt y brand' })
  const provider = llmProvider()
  if (!provider) return res.status(503).json({
    error: 'Sin API key. Exporta ANTHROPIC_API_KEY u OPENAI_API_KEY para activar la re-medición real.'
  })
  try {
    const answer = await askLLM(provider, prompt)
    const mentioned = new RegExp(brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(answer)
    res.json({
      engine: provider, prompt, brand, mentioned,
      cited: mentioned, // heurística: en texto plano, mención≈cita. Con SERP real se separan.
      answer_excerpt: answer.slice(0, 600),
      measured_at: new Date().toISOString(), state: 'real'
    })
  } catch (e) {
    res.status(502).json({ error: 'Fallo al consultar el LLM: ' + e.message })
  }
})

function llmProvider() {
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic'
  if (process.env.OPENAI_API_KEY) return 'openai'
  return null
}

async function askLLM(provider, prompt) {
  if (provider === 'anthropic') {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
        max_tokens: 700,
        messages: [{ role: 'user', content: prompt }]
      })
    })
    const j = await r.json()
    if (!r.ok) throw new Error(j.error?.message || r.status)
    return (j.content || []).map(c => c.text).join('\n')
  }
  // openai
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }]
    })
  })
  const j = await r.json()
  if (!r.ok) throw new Error(j.error?.message || r.status)
  return j.choices?.[0]?.message?.content || ''
}

// Sirve el frontend compilado (mismo origen que la API) -> deploy full-stack en un solo servicio.
app.use(express.static(path.join(ROOT, 'dist')))

app.listen(PORT, () => console.log(`GEO-OS en http://localhost:${PORT} · LLM: ${llmProvider() || 'ninguno (re-medición inactiva)'}`))
