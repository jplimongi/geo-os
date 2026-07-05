<script setup>
import { computed } from 'vue'
import { useClient } from '../stores/client'
const client = useClient()
const v = computed(() => client.feed?.visibility_by_engine || {})
// GEO Twin: 6 motores con deep-link reproducible (query real). Diferencial GEO-OS.
const engines = [
  { key: 'ChatGPT', url: 'https://chatgpt.com/?q=' },
  { key: 'Perplexity', url: 'https://www.perplexity.ai/search?q=' },
  { key: 'Gemini', url: 'https://gemini.google.com/app?q=' },
  { key: 'Google AIO', url: 'https://www.google.com/search?udm=50&q=' },
  { key: 'AI Mode', url: 'https://www.google.com/search?udm=50&q=' },
  { key: 'Claude', url: 'https://claude.ai/new?q=' }
]
const query = computed(() => (client.feed?.prompts_bank?.[0]?.prompt) || 'mejores cervezas españolas')
function score(k) {
  const i = (v.value.labels || []).indexOf(k)
  return i >= 0 ? v.value.brand?.[i] : null
}
</script>
<template>
  <section>
    <h1 class="section-title">👁 Visibilidad IA / GEO Twin</h1>
    <p class="muted" style="margin:6px 0 20px">6 motores con consulta real reproducible (deep-link). Diferencial GEO-OS. Query base: <strong>{{ query }}</strong></p>
    <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(220px,1fr))">
      <div class="card twin" v-for="e in engines" :key="e.key">
        <div class="twin__top">
          <strong>{{ e.key }}</strong>
          <span class="score">{{ score(e.key) == null ? 'pendiente' : score(e.key) + '%' }}</span>
        </div>
        <a class="btn btn--ghost twin__btn" :href="e.url + encodeURIComponent(query)" target="_blank" rel="noopener">Abrir consulta real ↗</a>
      </div>
    </div>
    <p class="muted" style="font-size:12px;margin-top:14px">
      El leaderboard competitivo multi-motor (SE Ranking) y el share por motor se llenan desde la tabla única.
    </p>
  </section>
</template>
<style scoped>
.twin__top{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
.score{font-family:'Barlow Condensed';font-size:22px;color:var(--brand-primary)}
.twin__btn{display:inline-block;font-size:13px}
</style>
