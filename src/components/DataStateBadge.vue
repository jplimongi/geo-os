<script setup>
// Regla de oro GEO-OS: cada dato declara su estado. Nada inventado.
const map = {
  real:       { t: 'real',      bg: '#EAF6EF', c: '#1E9E6A' },
  cualitativo:{ t: 'cualitativo', bg: '#EEF1F6', c: '#5B6B82' },
  pendiente:  { t: 'pendiente', bg: '#FCF3DA', c: '#9a7400' }
}
defineProps({ state: { type: String, default: 'pendiente' } })
</script>
<template>
  <span class="pill" :style="{ background: (map[state]||map.pendiente).bg, color: (map[state]||map.pendiente).c }">
    {{ (map[state]||map.pendiente).t }}
  </span>
</template>
