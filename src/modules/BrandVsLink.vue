<script setup>
import { computed } from 'vue'
import { useClient } from '../stores/client'
import BaseChart from '../components/BaseChart.vue'
const client = useClient()
const rows = computed(() => client.feed?.brand_vs_link || [])
const chart = computed(() => ({
  labels: rows.value.map(r => r.brand),
  datasets: [
    { label: 'Menciones', data: rows.value.map(r => r.mentions), backgroundColor: '#5B6B82' },
    { label: 'Enlaces (citas)', data: rows.value.map(r => r.links), backgroundColor: 'var(--brand-primary)' }
  ]
}))
</script>
<template>
  <section>
    <h1 class="section-title">⚖ Brand vs Link Presence</h1>
    <p class="muted" style="margin:6px 0 20px">El insight central: <strong>nos mencionan, no nos citan.</strong> Origen: propuesta Relevant.</p>
    <div class="card">
      <BaseChart type="bar" :data="chart" :options="{ scales:{ y:{ type:'logarithmic' } } }" />
      <p class="muted" style="font-size:12px;margin-top:10px">Escala logarítmica: la brecha mención↔enlace es de ~38× en San Miguel (23.596 vs 624).</p>
    </div>
  </section>
</template>
