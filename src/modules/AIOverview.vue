<script setup>
import { computed } from 'vue'
import { useClient } from '../stores/client'
import DataStateBadge from '../components/DataStateBadge.vue'
const client = useClient()
const s = computed(() => client.feed?.serp || {})
</script>
<template>
  <section>
    <h1 class="section-title">🔍 AI Overview / SERP</h1>
    <p class="muted" style="margin:6px 0 20px">Análisis SERP de Google. Origen: RT AI GEO Tool (DataForSEO). Keyword: <strong>{{ s.keyword }}</strong> <DataStateBadge :state="s.state" /></p>

    <div class="grid" style="grid-template-columns:1fr 1fr;align-items:start">
      <div class="card">
        <h3 style="font-family:'Barlow';font-size:15px;margin-bottom:10px">Bloque AI Overview</h3>
        <p>AIO presente: <strong :style="{ color: s.aio_present ? 'var(--ok)':'var(--muted)' }">{{ s.aio_present ? 'Sí' : 'No' }}</strong></p>
        <p>Cita a marca propia: <strong :style="{ color: s.aio_cites_brand ? 'var(--ok)':'var(--warn)' }">{{ s.aio_cites_brand ? 'Sí' : 'No' }}</strong></p>
        <h3 style="font-family:'Barlow';font-size:15px;margin:16px 0 8px">People Also Ask</h3>
        <ul style="margin:0;padding-left:18px;font-size:14px"><li v-for="(q,i) in s.paa" :key="i" style="margin-bottom:4px">{{ q }}</li></ul>
      </div>
      <div class="card">
        <h3 style="font-family:'Barlow';font-size:15px;margin-bottom:10px">Ranking orgánico</h3>
        <table class="tbl">
          <thead><tr><th>Pos.</th><th>Dominio</th></tr></thead>
          <tbody>
            <tr v-for="o in s.organic" :key="o.pos" :style="{ background: o.domain && o.domain.includes('mahou') ? '#FBE7EA':'' }">
              <td><strong>{{ o.pos }}</strong></td><td>{{ o.domain }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>
