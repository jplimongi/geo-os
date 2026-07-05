<script setup>
import { useRoute } from 'vue-router'
import { registryById } from './registry'
const route = useRoute()
const m = registryById[route.meta.moduleId] || {}
</script>
<template>
  <section>
    <h1 class="section-title">{{ m.icon }} {{ m.title }}</h1>
    <p class="muted" style="margin:6px 0 20px">Origen: {{ m.origin }}</p>
    <div class="card">
      <p><strong>Módulo registrado — pendiente de implementación (Fase 1).</strong></p>
      <p class="muted">Este módulo ya está cableado en la navegación, el router y el role-gating.
      Consume del feed (tabla única) y de la config del cliente igual que los módulos ya implementados.
      Se rellena con su vista bespoke sin tocar el core.</p>
    </div>
  </section>
</template>
