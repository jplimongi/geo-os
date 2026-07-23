import { createRouter, createWebHashHistory } from 'vue-router'
import { registry } from '../modules/registry'
import { useClient } from '../stores/client'
import { api } from '../api'

const routes = [
  { path: '/login', name: 'login', component: () => import('../layout/LoginView.vue') },
  {
    path: '/',
    component: () => import('../layout/AppShell.vue'),
    children: [
      { path: '', redirect: '/torre' },
      ...registry.map(m => ({ path: m.path.slice(1), name: m.id, component: m.comp, meta: { moduleId: m.id } }))
    ]
  }
]

export const router = createRouter({ history: createWebHashHistory(import.meta.env.BASE_URL), routes })

// Guard: sin sesion -> login. Con sesion pero sin permiso al modulo -> landing del rol.
router.beforeEach((to) => {
  const client = useClient()
  if (client.loading) return true
  if (to.name === 'login') return true
  if (!client.isAuthed) return { name: 'login' }
  const mid = to.meta?.moduleId
  if (mid && client.role.sees !== 'all' && Array.isArray(client.role.sees) && !client.role.sees.includes(mid)) {
    return { name: client.role.landing || 'torre' }
  }
  return true
})

// Adopción (Fase 3): registra el uso de módulos (beacon agregado por rol). Solo cuenta
// aperturas reales (cambia de módulo) para no inflar con recargas del mismo módulo.
let lastTracked = null
router.afterEach((to) => {
  const client = useClient()
  const mid = to.meta?.moduleId
  if (!mid || !client.isAuthed || mid === lastTracked) return
  lastTracked = mid
  api.track(client.id, mid)  // best-effort (no bloquea la navegación)
})
