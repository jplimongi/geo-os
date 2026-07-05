<script setup>
import { computed, ref } from 'vue'
import { useClient } from '../stores/client'
import DataStateBadge from '../components/DataStateBadge.vue'
const client = useClient()
const all = computed(() => client.feed?.prompts_bank || [])
const cluster = ref('todos')
const clusters = computed(() => ['todos', ...new Set(all.value.map(p => p.cluster))])
const rows = computed(() => cluster.value === 'todos' ? all.value : all.value.filter(p => p.cluster === cluster.value))
const presColor = { ausente:'var(--warn)', mencionada:'var(--accent)', citada:'var(--ok)' }
</script>
<template>
  <section>
    <h1 class="section-title">❝ Prompts & Tracking</h1>
    <p class="muted" style="margin:6px 0 16px">Banco de prompts real con volumen de búsqueda. Origen: propuesta Relevant + AI Volume (DataForSEO).</p>
    <div style="margin-bottom:14px">
      <button v-for="c in clusters" :key="c" class="btn btn--ghost" :style="{ marginRight:'8px', borderColor: cluster===c ? 'var(--brand-primary)':'', color: cluster===c ? 'var(--brand-primary)':'' }" @click="cluster=c">{{ c }}</button>
    </div>
    <div class="card">
      <table class="tbl">
        <thead><tr><th>Prompt</th><th>Clúster</th><th>Volumen</th><th>Criticidad</th><th>Presencia</th><th>Estado</th></tr></thead>
        <tbody>
          <tr v-for="(p,i) in rows" :key="i">
            <td><strong>{{ p.prompt }}</strong></td>
            <td>{{ p.cluster }}</td>
            <td>{{ p.volume == null ? '—' : p.volume.toLocaleString('es-ES') }}</td>
            <td>{{ p.criticidad }}</td>
            <td :style="{ color: presColor[p.presence] || 'inherit', fontWeight:600 }">{{ p.presence }}</td>
            <td><DataStateBadge :state="p.state" /></td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
