<script setup>
import { computed } from 'vue'
import { useClient } from '../stores/client'
const client = useClient()
const alerts = computed(() => client.feed?.alerts || [])
const sev = {
  critico: { t: 'Crítico', bg: '#FBE7EA', c: '#D7263D' },
  alto:    { t: 'Alto',    bg: '#FCF3DA', c: '#9a7400' },
  medio:   { t: 'Medio',   bg: '#EEF1F6', c: '#5B6B82' },
  bajo:    { t: 'Bajo',    bg: '#EAF6EF', c: '#1E9E6A' }
}
</script>
<template>
  <section>
    <h1 class="section-title">⚠ Riesgo & Alertas</h1>
    <p class="muted" style="margin:6px 0 20px">Severidad + disparador + owner + SLA + re-test. Origen: GEO-OS + propuesta Relevant.</p>
    <div class="card">
      <table class="tbl">
        <thead><tr><th>Severidad</th><th>Dominio</th><th>Disparador</th><th>Owner</th><th>SLA</th></tr></thead>
        <tbody>
          <tr v-for="(a,i) in alerts" :key="i">
            <td><span class="pill" :style="{ background:(sev[a.severity]||sev.medio).bg, color:(sev[a.severity]||sev.medio).c }">{{ (sev[a.severity]||sev.medio).t }}</span></td>
            <td>{{ a.domain }}</td><td>{{ a.trigger }}</td><td>{{ a.owner }}</td><td>{{ a.sla_h }}h</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
