<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useClient } from '../stores/client'
import { registry } from './registry'
const client = useClient()
const router = useRouter()
const roles = computed(() => client.config?.roles || [])
const modCount = (r) => r.sees === 'all' ? registry.length : (r.sees?.length || 0)
// Solo los roles con acceso total pueden parametrizar (toca credenciales).
const canEdit = computed(() => client.role?.sees === 'all')
function editRoles() { router.push({ name: 'parametrizacion', query: { tab: 'roles' } }) }
</script>
<template>
  <section>
    <div style="display:flex;justify-content:space-between;align-items:center;gap:12px">
      <h1 class="section-title" style="margin:0">⚙ Gobierno & Roles</h1>
      <button v-if="canEdit" class="btn" @click="editRoles">🎛 Editar roles y accesos →</button>
    </div>
    <p class="muted" style="margin:6px 0 20px">Role-gating real definido en la config del cliente. Matriz "quién ve qué". Origen: GEO-OS.</p>
    <div class="card">
      <table class="tbl">
        <thead><tr><th>Rol</th><th>Usuario</th><th>Módulos visibles</th><th>Aterriza en</th></tr></thead>
        <tbody>
          <tr v-for="r in roles" :key="r.id">
            <td><strong>{{ r.label }}</strong></td>
            <td>{{ r.credential?.user }}</td>
            <td>{{ r.sees === 'all' ? 'Todos (' + registry.length + ')' : modCount(r) + ' módulos' }}</td>
            <td>{{ r.landing }}</td>
          </tr>
        </tbody>
      </table>
      <p class="muted" style="font-size:12px;margin-top:12px">Multi-partner: el reparto de visibilidad se cambia editando <code>config.json</code>, sin tocar el core.</p>
    </div>
  </section>
</template>
