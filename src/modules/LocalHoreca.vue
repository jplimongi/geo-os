<script setup>
import { computed } from 'vue'
import { useClient } from '../stores/client'
import DataStateBadge from '../components/DataStateBadge.vue'
const client = useClient()
const pois = computed(() => client.feed?.local_horeca || [])
function color(s) { return s >= 75 ? 'var(--ok)' : s >= 60 ? 'var(--accent)' : 'var(--warn)' }
</script>
<template>
  <section>
    <h1 class="section-title">📍 Local / HORECA</h1>
    <p class="muted" style="margin:6px 0 20px">Señales locales para recomendación por IA (Ask Maps / GBP). Origen: visión Charlie + propuesta Relevant.</p>
    <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(280px,1fr))">
      <div class="card" v-for="p in pois" :key="p.poi">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <strong>{{ p.poi }}</strong><DataStateBadge :state="p.state" />
        </div>
        <div style="display:flex;gap:20px;margin:12px 0">
          <div><div class="muted" style="font-size:11px">GBP score</div><div style="font-family:'Barlow Condensed';font-size:30px" :style="{ color: color(p.gbp_score) }">{{ p.gbp_score }}</div></div>
          <div><div class="muted" style="font-size:11px">Reviews</div><div style="font-family:'Barlow Condensed';font-size:30px">{{ p.reviews }}</div></div>
        </div>
        <div class="pill" style="background:#FCF3DA;color:#9a7400">Oportunidad</div>
        <div style="font-size:13px;margin-top:6px">{{ p.opportunity }}</div>
      </div>
    </div>
    <p class="muted" style="font-size:12px;margin-top:14px">El mapa de POIs clicable (SVG Madrid) se cablea sobre estos mismos datos en la iteración de UX.</p>
  </section>
</template>
