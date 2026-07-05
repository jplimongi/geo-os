<script setup>
import { computed, onMounted } from 'vue'
import { useClient } from '../stores/client'
import { useOps } from '../stores/ops'
const client = useClient()
const ops = useOps()
onMounted(() => ops.init(client.id, client.feed))
const cols = [
  { key: 'pendiente', label: 'Pendiente' },
  { key: 'en_curso', label: 'En curso' },
  { key: 'hecho', label: 'Hecho' }
]
const byCol = (k) => ops.actions.filter(a => a.status === k)
async function move(a, status) { await ops.setStatus(a.id, status, `“${a.title}” → ${status}`) }
</script>
<template>
  <section>
    <h1 class="section-title">☑ Action Queue</h1>
    <p class="muted" style="margin:6px 0 20px">
      Cola de acciones persistente. Backend: <strong :style="{ color: ops.online ? 'var(--ok)':'var(--warn)' }">{{ ops.online ? 'conectado (guarda en disco)' : 'apagado (memoria)' }}</strong>.
      Las tarjetas que crea el Ciclo GEO aparecen aquí en vivo.
    </p>
    <div class="grid" style="grid-template-columns:repeat(3,1fr)">
      <div v-for="c in cols" :key="c.key">
        <div class="col__h">{{ c.label }} <span class="muted">({{ byCol(c.key).length }})</span></div>
        <div class="card kb" v-for="a in byCol(c.key)" :key="a.id">
          <strong>{{ a.title }}</strong>
          <div class="muted" style="font-size:12px;margin-top:6px">{{ a.owner }} · impacto {{ a.impact }} · {{ a.due }}</div>
          <div class="muted" style="font-size:11px;margin-top:2px">↳ {{ a.origin }}</div>
          <div class="kb__actions">
            <button v-if="a.status!=='pendiente'" class="mini" @click="move(a,'pendiente')">← Pendiente</button>
            <button v-if="a.status!=='en_curso'" class="mini" @click="move(a,'en_curso')">En curso</button>
            <button v-if="a.status!=='hecho'" class="mini" @click="move(a,'hecho')">Hecho ✓</button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
<style scoped>
.col__h{font-weight:700;text-transform:uppercase;font-size:12px;letter-spacing:.05em;margin-bottom:10px}
.kb{margin-bottom:10px;border-left:3px solid var(--brand-primary)}
.kb__actions{display:flex;gap:6px;margin-top:10px;flex-wrap:wrap}
.mini{border:1px solid var(--line);background:transparent;border-radius:6px;padding:4px 8px;font-size:11px;cursor:pointer}
.mini:hover{border-color:var(--brand-primary);color:var(--brand-primary)}
</style>
