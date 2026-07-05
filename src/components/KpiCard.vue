<script setup>
import DataStateBadge from './DataStateBadge.vue'
defineProps({ label: String, value: [String, Number], unit: String, state: String, hint: String })
</script>
<template>
  <div class="card kpi">
    <div class="kpi__label">{{ label }} <DataStateBadge v-if="state" :state="state" /></div>
    <div class="kpi__value">{{ value }}<span class="kpi__unit">{{ unit }}</span></div>
    <div class="kpi__hint muted" v-if="hint">{{ hint }}</div>
  </div>
</template>
<style scoped>
.kpi{display:flex;flex-direction:column;gap:6px}
.kpi__label{font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:.04em;display:flex;align-items:center;gap:6px}
.kpi__value{font-family:'Barlow Condensed';font-size:38px;line-height:1;color:var(--brand-ink)}
.kpi__unit{font-size:16px;margin-left:3px;color:var(--muted)}
.kpi__hint{font-size:12px}
</style>
