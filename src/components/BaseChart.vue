<script setup>
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { Chart, registerables } from 'chart.js'
Chart.register(...registerables)

const props = defineProps({ type: { type: String, default: 'bar' }, data: Object, options: Object })
const el = ref(null)
let chart = null

// Chart.js pinta en canvas y NO resuelve variables CSS -> las convertimos a color real.
function resolveVars(v) {
  if (typeof v === 'string' && v.startsWith('var(')) {
    const name = v.slice(4, -1).trim()
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#DC0019'
  }
  return v
}
function resolveData(data) {
  if (!data) return data
  return {
    ...data,
    datasets: (data.datasets || []).map(d => ({
      ...d,
      backgroundColor: Array.isArray(d.backgroundColor) ? d.backgroundColor.map(resolveVars) : resolveVars(d.backgroundColor),
      borderColor: Array.isArray(d.borderColor) ? d.borderColor.map(resolveVars) : resolveVars(d.borderColor)
    }))
  }
}

function render() {
  if (chart) chart.destroy()
  if (!el.value || !props.data) return
  chart = new Chart(el.value, {
    type: props.type,
    data: resolveData(props.data),
    options: { responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { font: { family: 'Barlow' } } } },
      ...(props.options || {}) }
  })
}
onMounted(render)
watch(() => [props.data, props.type], render, { deep: true })
onBeforeUnmount(() => chart && chart.destroy())
</script>
<template><div style="position:relative;height:280px"><canvas ref="el"></canvas></div></template>
