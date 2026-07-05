<script setup>
import { computed } from 'vue'
import { useClient } from '../stores/client'
import BaseChart from '../components/BaseChart.vue'
const client = useClient()
const rows = computed(() => client.feed?.competitors || [])
const chart = computed(() => ({
  labels: rows.value.map(r => r.name),
  datasets: [
    { label: 'AI Visibility', data: rows.value.map(r => r.ai_visibility), backgroundColor: 'var(--brand-primary)' },
    { label: 'Citation Share', data: rows.value.map(r => r.citation_share), backgroundColor: '#2D6CDF' },
    { label: 'Autoridad (DR)', data: rows.value.map(r => r.authority), backgroundColor: '#5B6B82' }
  ]
}))
</script>
<template>
  <section>
    <h1 class="section-title">⚔ Competidores</h1>
    <p class="muted" style="margin:6px 0 20px">Marca vs competidores. Origen: visión Charlie. Marca propia resaltada en rojo.</p>
    <div class="card"><BaseChart type="bar" :data="chart" /></div>
    <div class="card" style="margin-top:16px">
      <table class="tbl">
        <thead><tr><th>Marca</th><th>AI Visibility</th><th>Citation Share</th><th>Autoridad</th></tr></thead>
        <tbody>
          <tr v-for="r in rows" :key="r.name" :style="{ background: r.is_brand ? '#FBE7EA' : '' }">
            <td><strong>{{ r.name }}</strong></td><td>{{ r.ai_visibility }}%</td><td>{{ r.citation_share }}%</td><td>{{ r.authority }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
