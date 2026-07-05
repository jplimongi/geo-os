<script setup>
import { computed } from 'vue'
import { useClient } from '../stores/client'
import DataStateBadge from '../components/DataStateBadge.vue'
const client = useClient()
const n = computed(() => client.feed?.narratives || { layers: [], claims: [] })
const estado = {
  ok: { t: 'OK', bg: '#EAF6EF', c: '#1E9E6A' },
  medio: { t: 'Medio', bg: '#EEF1F6', c: '#5B6B82' },
  riesgo: { t: 'Riesgo', bg: '#FCF3DA', c: '#9a7400' },
  critico: { t: 'Crítico', bg: '#FBE7EA', c: '#D7263D' }
}
const claimSt = { aprobado: '#1E9E6A', en_revision: '#9a7400', pendiente: '#5B6B82' }
</script>
<template>
  <section>
    <h1 class="section-title">¶ Narrativas & Claims</h1>
    <p class="muted" style="margin:6px 0 20px">4 capas narrativas + flujo de validación de claims. Origen: GEO-OS + propuesta Relevant.</p>

    <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(230px,1fr));margin-bottom:20px">
      <div class="card" v-for="l in n.layers" :key="l.layer">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <strong>{{ l.layer }}</strong>
          <span class="pill" :style="{ background:(estado[l.estado]||estado.medio).bg, color:(estado[l.estado]||estado.medio).c }">{{ (estado[l.estado]||estado.medio).t }}</span>
        </div>
        <div class="muted" style="font-size:13px">{{ l.diagnostico }}</div>
      </div>
    </div>

    <div class="card">
      <h3 style="font-family:'Barlow';font-size:15px;margin-bottom:10px">Validación de claims</h3>
      <table class="tbl">
        <thead><tr><th>Claim</th><th>Estado validación</th><th>Dato</th></tr></thead>
        <tbody>
          <tr v-for="(c,i) in n.claims" :key="i">
            <td><strong>{{ c.claim }}</strong></td>
            <td :style="{ color: claimSt[c.status], fontWeight:600 }">{{ c.status.replace('_',' ') }}</td>
            <td><DataStateBadge :state="c.state" /></td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
