import { createRouter, createWebHashHistory } from 'vue-router'
import { registry } from '../modules/registry'
import { useClient } from '../stores/client'

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
