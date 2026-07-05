import { defineStore } from 'pinia'
import { api } from '../api'

// Estado operativo REAL. Fuente de verdad = backend (persistencia en fichero).
// Si el backend no está disponible, opera en memoria sembrado del feed (la UI nunca se rompe).
export const useOps = defineStore('ops', {
  state: () => ({
    clientId: null,
    online: false,     // ¿backend disponible?
    loaded: false,
    actions: [],
    cycleScore: 0,
    lastRemeasure: null,
    log: []
  }),
  actions: {
    log_(msg) { this.log.unshift({ t: new Date().toLocaleTimeString('es-ES'), msg }) },

    async init(clientId, feed) {
      if (this.loaded) return
      this.clientId = clientId
      this.cycleScore = feed?.cycle?.score_before ?? 0
      this.online = await api.health()
      if (this.online) {
        try { this.actions = await api.getActions(clientId) }
        catch { this.actions = seed(feed) }
      } else {
        this.actions = seed(feed)
      }
      this.loaded = true
    },

    async propose(payload) {
      const dup = this.actions.find(a => a.origin === payload.origin && a.title === payload.title)
      if (dup) return dup.id
      if (this.online) {
        const a = await api.createAction(this.clientId, payload)
        this.actions.unshift(a); this.log_(`Propuesta persistida: “${a.title}”`); return a.id
      }
      const a = { id: `mem-${Date.now()}`, status: 'pendiente', ...payload }
      this.actions.unshift(a); this.log_(`Propuesta (memoria): “${a.title}”`); return a.id
    },

    async setStatus(id, status, note) {
      const a = this.actions.find(x => x.id === id); if (!a) return
      a.status = status
      if (this.online) { try { await api.updateAction(this.clientId, id, { status }) } catch {} }
      if (note) this.log_(note)
    },

    // Re-medición REAL contra el LLM (vía backend). Devuelve el resultado o un error legible.
    async remeasure(id, prompt, brand, scoreAfterOnHit) {
      if (!this.online) {
        this.log_('Re-medición no disponible: backend apagado (arranca «npm run server»).')
        return { error: 'backend_off' }
      }
      try {
        const r = await api.remeasure(this.clientId, prompt, brand)
        this.lastRemeasure = r
        if (id) await this.setStatus(id, 'hecho')
        this.cycleScore = r.mentioned ? (scoreAfterOnHit ?? this.cycleScore) : this.cycleScore
        this.log_(`Re-medición ${r.engine}: ${brand} ${r.mentioned ? 'CITADA/mencionada ✓' : 'ausente ✗'} en “${prompt}”`)
        return r
      } catch (e) {
        this.log_(`Re-medición falló: ${e.message}`)
        return { error: e.message }
      }
    }
  }
})

function seed(feed) {
  return (feed?.actions || []).map((a, i) => ({ id: `seed-${i}`, ...a }))
}
