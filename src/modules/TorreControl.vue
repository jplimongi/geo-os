<script setup>
import { computed, onMounted } from 'vue'
import { useClient } from '../stores/client'
import { useOps } from '../stores/ops'
import KpiCard from '../components/KpiCard.vue'
import BaseChart from '../components/BaseChart.vue'

const client = useClient()
const ops = useOps()
onMounted(() => ops.init(client.id, client.feed))
const feed = computed(() => client.feed || {})
const kpis = computed(() => feed.value.kpis || [])

const visData = computed(() => {
  const v = feed.value.visibility_by_engine
  if (!v) return null
  return {
    labels: v.labels,
    datasets: [{ label: 'Visibilidad marca (%)', data: v.brand,
      backgroundColor: 'var(--brand-primary)' }]
  }
})

const whatChanged = computed(() => {
  const a = feed.value.alerts || []
  return {
    ocurre: a.filter(x => x.severity === 'critico').map(x => x.trigger),
    riesgo: a.filter(x => x.severity !== 'critico').map(x => x.trigger),
    hacer: ops.actions.filter(x => x.status !== 'hecho').map(x => x.title)
  }
})
</script>
<template>
  <section>
    <h1 class="section-title">◎ Torre de Control</h1>
    <p class="muted" style="margin:6px 0 20px">
      {{ client.config?.brand?.name }} · {{ feed.period }} · <em>{{ feed.source }}</em>
    </p>

    <div class="kpi-row" style="margin-bottom:22px">
      <KpiCard v-for="k in kpis" :key="k.id" :label="k.label" :value="k.value" :unit="k.unit" :state="k.state" :hint="k.hint" />
    </div>

    <div class="grid" style="grid-template-columns:1.3fr 1fr;align-items:start">
      <div class="card">
        <h3>Visibilidad por motor</h3>
        <p class="muted" style="font-size:12px;margin:4px 0 10px">{{ feed.visibility_by_engine?.note }}</p>
        <BaseChart v-if="visData" type="bar" :data="visData" />
      </div>

      <div class="card">
        <h3>Qué cambió esta semana</h3>
        <div class="wc">
          <div><div class="wc__h" style="color:var(--warn)">Qué ocurre</div>
            <ul><li v-for="(t,i) in whatChanged.ocurre" :key="i">{{ t }}</li><li v-if="!whatChanged.ocurre.length" class="muted">—</li></ul></div>
          <div><div class="wc__h" style="color:var(--accent)">En riesgo</div>
            <ul><li v-for="(t,i) in whatChanged.riesgo" :key="i">{{ t }}</li></ul></div>
          <div><div class="wc__h" style="color:var(--ok)">Qué hacer</div>
            <ul><li v-for="(t,i) in whatChanged.hacer" :key="i">{{ t }}</li></ul></div>
        </div>
      </div>
    </div>
  </section>
</template>
<style scoped>
h3{font-family:'Barlow';font-size:15px;font-weight:600;margin-bottom:8px}
.wc{display:flex;flex-direction:column;gap:12px}
.wc__h{font-size:11px;text-transform:uppercase;letter-spacing:.05em;font-weight:700;margin-bottom:4px}
.wc ul{margin:0;padding-left:16px;font-size:13px}
.wc li{margin-bottom:4px}
</style>
