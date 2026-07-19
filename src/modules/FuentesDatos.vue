<script setup>
import { computed, onMounted, ref } from 'vue'
import { useClient } from '../stores/client'
import { useOps } from '../stores/ops'
import { api } from '../api'
import { registryById } from './registry'
import DataStateBadge from '../components/DataStateBadge.vue'

const client = useClient()
const ops = useOps()
const llm = ref(null)  // proveedor LLM activo, del /health
onMounted(async () => {
  await ops.init(client.id, client.feed)
  llm.value = await api.healthInfo()
})

const sources = computed(() => client.feed?.sources || [])
const feedSource = computed(() => client.feed?.source || '—')
const asOf = computed(() => client.feed?.as_of || '—')
const dataSource = computed(() => client.config?.data_source || {})

// Integridad del feed contra el contrato de datos (src/feedContract.js).
const health = computed(() => client.feedHealth)
const emptySections = computed(() => health.value.sections.filter(s => !s.populated))

const counts = computed(() => {
  const c = { real: 0, cualitativo: 0, pendiente: 0 }
  sources.value.forEach(s => { c[s.status] = (c[s.status] || 0) + 1 })
  return c
})
const modTitle = (id) => registryById[id]?.title || id
</script>
<template>
  <section>
    <h1 class="section-title">🔌 Fuentes & Datos</h1>
    <p class="muted" style="margin:6px 0 20px">
      La capa de datos que alimenta la herramienta (aportación de Relevant). Cada métrica declara su proveedor, estado y última actualización.
    </p>

    <!-- Estado del pipeline -->
    <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(200px,1fr));margin-bottom:20px">
      <div class="card">
        <div class="muted lbl">Pipeline / backend</div>
        <div class="big" :style="{ color: ops.online ? 'var(--ok)':'var(--warn)' }">{{ ops.online ? 'Conectado' : 'Estático' }}</div>
        <div class="muted" style="font-size:12px">{{ ops.online ? 'sirviendo tabla única vía API' : 'feed.json (sin backend)' }}</div>
      </div>
      <div class="card">
        <div class="muted lbl">Tabla única (data_source)</div>
        <div style="font-family:'Barlow Condensed';font-size:22px">{{ dataSource.type || 'bigquery' }}</div>
        <div class="muted" style="font-size:12px">{{ dataSource.ref || 'pendiente de asignar' }}</div>
      </div>
      <div class="card">
        <div class="muted lbl">Cobertura de datos</div>
        <div class="big">{{ counts.real }}<span style="font-size:16px;color:var(--muted)">/{{ sources.length }}</span></div>
        <div class="muted" style="font-size:12px">fuentes con dato real · {{ counts.pendiente }} pendientes</div>
      </div>
      <div class="card">
        <div class="muted lbl">Re-medición LLM</div>
        <div class="big" :style="{ color: (llm && llm.llm !== 'none') ? 'var(--ok)':'var(--muted)' }">
          {{ llm ? (llm.llm === 'none' ? 'Sin key' : llm.llm) : 'Offline' }}
        </div>
        <div class="muted" style="font-size:12px">{{ (llm && llm.llm !== 'none') ? 'motor real activo (Ciclo GEO)' : 'exporta ANTHROPIC/OPENAI_API_KEY' }}</div>
      </div>
      <div class="card">
        <div class="muted lbl">Integridad del feed</div>
        <div class="big" :style="{ color: health.ok ? 'var(--ok)':'var(--accent)' }">{{ health.populated_count }}<span style="font-size:16px;color:var(--muted)">/{{ health.total }}</span></div>
        <div class="muted" style="font-size:12px">{{ health.ok ? 'todas las secciones pobladas' : emptySections.length + ' secciones pendientes de volcado' }}</div>
      </div>
    </div>

    <!-- Aviso de secciones vacías: el operador SABE que un módulo está mudo por falta de dato -->
    <div v-if="!health.ok" class="card" style="border-left:3px solid var(--accent);margin-bottom:20px">
      <h3 style="color:var(--accent)">⚠ Secciones del feed pendientes de volcado</h3>
      <p class="muted" style="font-size:13px;margin-bottom:10px">
        Estos módulos están cableados pero su sección del feed llega vacía. No es un fallo: es dato pendiente del pipeline de Relevant.
      </p>
      <span v-for="s in emptySections" :key="s.key" class="chip" style="border-color:var(--accent)">
        {{ modTitle(s.module) }} <code style="font-size:10px;opacity:.7">{{ s.key }}</code>
      </span>
      <p v-if="health.meta_missing.length" class="muted" style="font-size:12px;margin-top:10px">
        Metadatos ausentes en cabecera: <strong>{{ health.meta_missing.join(', ') }}</strong>.
      </p>
    </div>

    <!-- Mapa proveedor -> métrica -> módulo -->
    <div class="card">
      <h3>Proveedores y qué alimentan</h3>
      <table class="tbl">
        <thead><tr><th>Proveedor</th><th>Alimenta</th><th>Módulos</th><th>Última act.</th><th>Estado</th></tr></thead>
        <tbody>
          <tr v-for="s in sources" :key="s.provider">
            <td><strong>{{ s.provider }}</strong></td>
            <td>{{ s.feeds }}</td>
            <td><span v-for="m in s.modules" :key="m" class="chip">{{ modTitle(m) }}</span></td>
            <td>{{ s.last_update || '—' }}</td>
            <td><DataStateBadge :state="s.status" /></td>
          </tr>
        </tbody>
      </table>
      <p class="muted" style="font-size:12px;margin-top:12px">
        Fuente del feed actual: <em>{{ feedSource }}</em> · fecha-sellado {{ asOf }}.
        Cuando Relevant conecte su pipeline, estas fuentes pasan de <strong>pendiente</strong> a <strong>real</strong> sin tocar los módulos.
      </p>
    </div>
  </section>
</template>
<style scoped>
h3{font-family:'Barlow';font-size:15px;font-weight:600;margin-bottom:10px}
.lbl{font-size:12px;text-transform:uppercase;letter-spacing:.04em}
.big{font-family:'Barlow Condensed';font-size:34px;line-height:1.1}
.chip{display:inline-block;background:var(--brand-bg);border:1px solid var(--line);border-radius:6px;padding:2px 7px;font-size:11px;margin:0 4px 4px 0}
</style>
