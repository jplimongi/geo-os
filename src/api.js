// Cliente HTTP al backend GEO-OS. Envía el token de sesión (si hay) en cada request.
const BASE = '/api'

let TOKEN = null
export function setToken(t) { TOKEN = t }

async function req(path, opts = {}) {
  const headers = { 'content-type': 'application/json', ...(opts.headers || {}) }
  if (TOKEN) headers.authorization = `Bearer ${TOKEN}`
  const r = await fetch(BASE + path, { ...opts, headers })
  if (!r.ok) {
    const body = await r.json().catch(() => ({}))
    const err = new Error(body.error || `HTTP ${r.status}`)
    err.status = r.status
    throw err
  }
  return r.json()
}

export const api = {
  async health() { try { await req('/health'); return true } catch { return false } },
  healthInfo: () => req('/health').catch(() => null),  // { ok, llm, ts } o null si backend off
  login: (id, user, pass) => req(`/client/${id}/login`, { method: 'POST', body: JSON.stringify({ user, pass }) }),
  getPublicConfig: (id) => req(`/client/${id}/public`),  // saneada, sin credenciales (pre-login)
  getConfig: (id) => req(`/client/${id}/config`),        // con usuarios, sin passwords (autenticada)
  getFeed: (id) => req(`/client/${id}/feed`),            // dato de negocio: solo autenticado
  listClients: () => req('/clients'),
  createClient: (config) => req('/clients', { method: 'POST', body: JSON.stringify({ config }) }),
  updateConfig: (id, config) => req(`/client/${id}/config`, { method: 'PUT', body: JSON.stringify({ config }) }),
  patchFeed: (id, patch) => req(`/client/${id}/feed`, { method: 'PATCH', body: JSON.stringify({ patch }) }),
  // Conexiones (las llaves nunca vuelven: solo estado)
  getConnections: (id) => req(`/client/${id}/connections`),
  setLlmKey: (id, body) => req(`/client/${id}/connections/llm`, { method: 'PUT', body: JSON.stringify(body) }),
  setProviderKey: (id, name, key) => req(`/client/${id}/connections/provider/${name}`, { method: 'PUT', body: JSON.stringify({ key }) }),
  // Uso & coste
  getUsage: (id, period) => req(`/client/${id}/usage${period ? `?period=${period}` : ''}`),
  addUsage: (id, entry) => req(`/client/${id}/usage`, { method: 'POST', body: JSON.stringify(entry) }),
  getPricing: () => req('/pricing'),
  setPricing: (pricing) => req('/pricing', { method: 'PUT', body: JSON.stringify({ pricing }) }),
  getActions: (id) => req(`/client/${id}/actions`),
  createAction: (id, action) => req(`/client/${id}/actions`, { method: 'POST', body: JSON.stringify(action) }),
  updateAction: (id, aid, patch) => req(`/client/${id}/actions/${aid}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  remeasure: (id, prompt, brand) => req(`/client/${id}/remeasure`, { method: 'POST', body: JSON.stringify({ prompt, brand }) })
}
