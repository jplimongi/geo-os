<script setup>
import { computed } from 'vue'
import { useClient } from '../stores/client'
const client = useClient()
const agents = computed(() => client.feed?.agents || [])
const st = {
  activo: { t: 'Activo', bg: '#EAF6EF', c: '#1E9E6A' },
  con_aprobacion: { t: 'Con aprobación', bg: '#FCF3DA', c: '#9a7400' },
  pausado: { t: 'Pausado', bg: '#EEF1F6', c: '#5B6B82' }
}
</script>
<template>
  <section>
    <h1 class="section-title">🤖 Agentes & Automatización</h1>
    <p class="muted" style="margin:6px 0 20px">Agentes sobre la capa MCP. Origen: GEO-OS. Solo visible para Admin/Squad.</p>
    <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(260px,1fr))">
      <div class="card" v-for="a in agents" :key="a.name">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <strong style="font-size:17px">{{ a.name }}</strong>
          <span class="pill" :style="{ background:(st[a.status]||st.pausado).bg, color:(st[a.status]||st.pausado).c }">{{ (st[a.status]||st.pausado).t }}</span>
        </div>
        <div class="muted" style="font-size:13px">{{ a.role }}</div>
        <div class="muted" style="font-size:11px;margin-top:10px">Última ejecución: {{ a.last }}</div>
      </div>
    </div>
  </section>
</template>
