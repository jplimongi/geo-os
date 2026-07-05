<script setup>
import { computed } from 'vue'
import { useClient } from '../stores/client'
const client = useClient()
const rows = computed(() => client.feed?.reporting || [])
const brand = computed(() => client.config?.brand?.name || 'cliente')
function exportXlsx() {
  alert('Export white-label (.xlsx) — se genera vía ExcelJS con la marca de ' + brand.value + '.\n(Stub de UI: la generación real la hace la capa de datos.)')
}
</script>
<template>
  <section>
    <h1 class="section-title">📄 Reporting</h1>
    <p class="muted" style="margin:6px 0 20px">Cadencia + owners + export white-label. Origen: GEO-OS + propuesta Relevant.</p>
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <h3 style="font-family:'Barlow';font-size:15px">Cadencia de reporting</h3>
        <button class="btn" @click="exportXlsx">⬇ Exportar Excel white-label</button>
      </div>
      <table class="tbl">
        <thead><tr><th>Cadencia</th><th>Artefacto</th><th>Owner</th><th>Canal</th></tr></thead>
        <tbody>
          <tr v-for="(r,i) in rows" :key="i">
            <td><strong>{{ r.cadence }}</strong></td><td>{{ r.artifact }}</td><td>{{ r.owner }}</td><td>{{ r.channel }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
