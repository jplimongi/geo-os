import { defineStore } from 'pinia'
import { applyTheme } from '../theme'

// Cliente activo: por env de build (VITE_CLIENT) o 'mahou' por defecto.
// Un cliente = un config.json + un feed.json. El core no cambia entre clientes.
const CLIENT_ID = import.meta.env.VITE_CLIENT || 'mahou'

export const useClient = defineStore('client', {
  state: () => ({
    id: CLIENT_ID,
    config: null,     // identidad, dominios, marcas, roles, verticales
    feed: null,       // "tabla unica" normalizada (la llena el pipeline de Relevant)
    role: null,       // rol logueado
    loading: true,
    error: null
  }),
  getters: {
    isAuthed: (s) => !!s.role,
    // Modulos visibles para el rol actual (role-gating desde config).
    visibleModules: (s) => (registry) => {
      if (!s.role) return []
      const sees = s.role.sees
      return registry.filter(m =>
        (sees === 'all' || (Array.isArray(sees) && sees.includes(m.id))) &&
        (!s.config?.disabled_modules?.includes(m.id)) &&
        (!m.requiresPlatformAdmin || s.role?.platform_admin === true)
      )
    }
  },
  actions: {
    async load() {
      try {
        const base = import.meta.env.BASE_URL
        const [cfg, feed] = await Promise.all([
          fetch(`${base}clients/${this.id}/config.json`).then(r => r.json()),
          fetch(`${base}clients/${this.id}/feed.json`).then(r => r.json()).catch(() => null)
        ])
        this.config = cfg
        this.feed = feed
        applyTheme(cfg.brand)
      } catch (e) {
        this.error = e.message
      } finally {
        this.loading = false
      }
    },
    login(user, pass) {
      const roles = this.config?.roles || []
      const match = roles.find(r =>
        r.credential?.user?.toLowerCase() === (user || '').toLowerCase() &&
        (r.credential?.pass === pass || (r.credential?.pass === '' && !pass))
      )
      if (match) { this.role = match; return match }
      return null
    },
    logout() { this.role = null },
    // Previsualizar/operar otro cliente en runtime (recarga config+feed y pide re-login).
    async switchTo(id) {
      this.role = null; this.id = id; this.loading = true; this.error = null
      await this.load()
    }
  }
})
