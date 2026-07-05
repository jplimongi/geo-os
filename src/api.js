// Cliente HTTP al backend GEO-OS. Si el backend no está, se degrada con gracia (online=false)
// y la app sigue funcionando con el feed estático (nunca se rompe la UI).
const BASE = '/api'

async function req(path, opts) {
  const r = await fetch(BASE + path, {
    headers: { 'content-type': 'application/json' }, ...opts
  })
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
  listClients: () => req('/clients'),
  createClient: (config) => req('/clients', { method: 'POST', body: JSON.stringify({ config }) }),
  getActions: (id) => req(`/client/${id}/actions`),
  createAction: (id, action) => req(`/client/${id}/actions`, { method: 'POST', body: JSON.stringify(action) }),
  updateAction: (id, aid, patch) => req(`/client/${id}/actions/${aid}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  remeasure: (id, prompt, brand) => req(`/client/${id}/remeasure`, { method: 'POST', body: JSON.stringify({ prompt, brand }) })
}
