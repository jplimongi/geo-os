<script setup>
import { computed } from 'vue'
import { useClient } from '../stores/client'
import DataStateBadge from '../components/DataStateBadge.vue'
const client = useClient()
const rows = computed(() => client.feed?.authority || [])
const fmt = (v) => v == null ? '—' : v
</script>
<template>
  <section>
    <h1 class="section-title">★ Autoridad / ORM</h1>
    <p class="muted" style="margin:6px 0 20px">DR (Ahrefs) + DIR (SE Ranking) + backlinks. Origen: RT AI GEO Tool + propuesta Relevant.</p>
    <div class="card">
      <table class="tbl">
        <thead><tr><th>Dominio</th><th>DR</th><th>DIR</th><th>Backlinks</th><th>Ref. domains</th><th>% Dofollow</th><th>Estado</th></tr></thead>
        <tbody>
          <tr v-for="d in rows" :key="d.domain">
            <td><strong>{{ d.domain }}</strong></td>
            <td>{{ fmt(d.dr) }}</td><td>{{ fmt(d.dir) }}</td>
            <td>{{ fmt(d.backlinks) }}</td><td>{{ fmt(d.refdomains) }}</td>
            <td>{{ d.dofollow_pct == null ? '—' : d.dofollow_pct + '%' }}</td>
            <td><DataStateBadge :state="d.state" /></td>
          </tr>
        </tbody>
      </table>
      <p class="muted" style="font-size:12px;margin-top:12px">
        DR ya real (Ahrefs). DIR/backlinks/refdomains se llenan al conectar el pipeline de SE Ranking desde la tabla única.
      </p>
    </div>
  </section>
</template>
