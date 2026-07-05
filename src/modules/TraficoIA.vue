<script setup>
import { computed } from 'vue'
import { useClient } from '../stores/client'
import BaseChart from '../components/BaseChart.vue'
import DataStateBadge from '../components/DataStateBadge.vue'
const client = useClient()
const rows = computed(() => client.feed?.ga4_ai_traffic || [])
const byEngine = computed(() => {
  const m = {}
  rows.value.forEach(r => { m[r.engine] = (m[r.engine] || 0) + r.sessions })
  return m
})
const chart = computed(() => ({
  labels: Object.keys(byEngine.value),
  datasets: [{ label: 'Sesiones desde IA', data: Object.values(byEngine.value), backgroundColor: 'var(--brand-primary)' }]
}))
</script>
<template>
  <section>
    <h1 class="section-title">📈 Tráfico IA (GA4)</h1>
    <p class="muted" style="margin:6px 0 20px">Qué páginas reciben tráfico de cada LLM. Origen: propuesta Relevant (GA4). Pendiente de volcado real.</p>
    <div class="grid" style="grid-template-columns:1fr 1.2fr;align-items:start">
      <div class="card"><h3 style="font-family:'Barlow';font-size:15px;margin-bottom:8px">Sesiones por motor</h3><BaseChart type="doughnut" :data="chart" /></div>
      <div class="card">
        <table class="tbl">
          <thead><tr><th>Marca</th><th>Motor</th><th>Landing</th><th>Sesiones</th><th>Estado</th></tr></thead>
          <tbody>
            <tr v-for="(r,i) in rows" :key="i">
              <td><strong>{{ r.brand }}</strong></td><td>{{ r.engine }}</td><td><code>{{ r.landing }}</code></td>
              <td>{{ r.sessions.toLocaleString('es-ES') }}</td><td><DataStateBadge :state="r.state" /></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>
