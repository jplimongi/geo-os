<script setup>
import { computed } from 'vue'
import { useClient } from '../stores/client'
import DataStateBadge from '../components/DataStateBadge.vue'
const client = useClient()
const bl = computed(() => client.feed?.brand_vs_link || [])
</script>
<template>
  <section>
    <h1 class="section-title">⌕ Data Resultados IA</h1>
    <p class="muted" style="margin:6px 0 20px">Explorador del histórico de resultados IA (citas · menciones · dominios dominantes). Origen: RT AI GEO Tool (BigQuery).</p>
    <div class="card">
      <h3 style="font-family:'Barlow';font-size:15px;margin-bottom:10px">Citas vs menciones por marca</h3>
      <table class="tbl">
        <thead><tr><th>Marca</th><th>Menciones</th><th>Citas (enlaces)</th><th>Ratio cita/mención</th><th>Estado</th></tr></thead>
        <tbody>
          <tr v-for="b in bl" :key="b.brand">
            <td><strong>{{ b.brand }}</strong></td>
            <td>{{ b.mentions.toLocaleString('es-ES') }}</td>
            <td>{{ b.links.toLocaleString('es-ES') }}</td>
            <td>{{ (b.links / b.mentions * 100).toFixed(1) }}%</td>
            <td><DataStateBadge :state="b.state" /></td>
          </tr>
        </tbody>
      </table>
      <p class="muted" style="font-size:12px;margin-top:12px">
        Dominios dominantes, comparativas mes a mes y generador de prompts se cablean sobre las tablas de BigQuery del pipeline de Relevant (tabla única).
      </p>
    </div>
  </section>
</template>
