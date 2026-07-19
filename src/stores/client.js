import { defineStore } from 'pinia'
import { applyTheme } from '../theme'
import { validateFeed } from '../feedContract'
import { api } from '../api'

// Cliente activo: por env de build (VITE_CLIENT) o 'mahou' por defecto.
// Un cliente = un config.json + un feed.json. El core no cambia entre clientes.
const CLIENT_ID = import.meta.env.VITE_CLIENT || 'mahou'

export const useClient = defineStore('client', {
  state: () => ({
    id: CLIENT_ID,
    config: null,     // identidad, dominios, marcas, roles, verticales
    feed: null,       // "tabla unica" normalizada (la llena el pipeline de Relevant)
    role: null,       // rol logueado
    token: null,      // token de sesión (se envía en cada request a la API)
    loading: true,
    error: null
  }),
  getters: {
    isAuthed: (s) => !!s.role,
    // Salud del feed contra el contrato de datos: avisa de secciones vacías/ausentes
    // para que un volcado parcial de Relevant no deje módulos silenciosamente mudos.
    feedHealth: (s) => validateFeed(s.feed),
    // Modulos visibles para el rol actual (role-gating desde config).
    visibleModules: (s) => (registry) => {
      if (!s.role) return []
      const sees = s.role.sees
      return registry.filter(m =>
        (sees === 'all' || (Array.isArray(sees) && sees.includes(m.id))) &&
        (!s.config?.disabled_modules?.includes(m.id)) &&
        (!m.requiresPlatformAdmin || s.role?.platform_admin === true) &&
        (!m.requiresFullAccess || sees === 'all')
      )
    }
  },
  actions: {
    // Carga solo la config (identidad/tema/estructura de roles, SIN contraseñas).
    // El feed es dato de negocio y se carga tras autenticarse.
    async load() {
      try {
        // Config saneada (sin credenciales) para tema/identidad del login.
        this.config = await api.getPublicConfig(this.id)
        applyTheme(this.config.brand)
      } catch (e) {
        this.error = 'No se pudo cargar el cliente (¿backend arrancado?): ' + e.message
      } finally {
        this.loading = false
      }
    },
    // Login REAL contra el backend: verifica el hash server-side y emite token.
    // Devuelve el rol si va bien; lanza Error con mensaje si no.
    async login(user, pass) {
      const { token, role } = await api.login(this.id, user, pass)
      this.token = token; this.role = role
      api.setToken(token)
      // Recarga config completa (con usuarios) y el feed, ya autenticado.
      try { this.config = await api.getConfig(this.id) } catch {}
      try { this.feed = await api.getFeed(this.id) } catch { this.feed = null }
      return role
    },
    logout() { this.role = null; this.token = null; this.feed = null; api.setToken(null) },

    // Guarda la parametrización editada desde la UI, la persiste en backend y la
    // aplica EN CALIENTE (reaplica tema, refresca role si cambió el rol actual).
    async saveConfig(newConfig) {
      const r = await api.updateConfig(this.id, newConfig)
      this.config = r.config
      applyTheme(r.config.brand)
      if (this.role) {
        const same = (r.config.roles || []).find(x => x.id === this.role.id)
        if (same) this.role = same
      }
      return r.config
    },

    // Merge parcial del feed (prompts monitorizados) con persistencia + recarga en caliente.
    async saveFeedPatch(patch) {
      const r = await api.patchFeed(this.id, patch)
      this.feed = r.feed
      return r.feed
    },
    // Previsualizar/operar otro cliente en runtime (recarga config+feed y pide re-login).
    async switchTo(id) {
      this.role = null; this.token = null; this.feed = null; api.setToken(null)
      this.id = id; this.loading = true; this.error = null
      await this.load()
    }
  }
})
