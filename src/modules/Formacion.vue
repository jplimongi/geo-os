<script setup>
import { computed } from 'vue'
import { useClient } from '../stores/client'
const client = useClient()
const courses = computed(() => client.feed?.training || [])
</script>
<template>
  <section>
    <h1 class="section-title">🎓 Formación</h1>
    <p class="muted" style="margin:6px 0 20px">Onboarding por rol + microcursos + certificación. Origen: GEO-OS.</p>
    <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(240px,1fr))">
      <div class="card" v-for="c in courses" :key="c.course">
        <div class="pill" style="background:#EEF1F6;color:#5B6B82">{{ c.role }}</div>
        <div style="font-weight:600;margin:10px 0 6px;font-size:16px">{{ c.course }}</div>
        <div class="muted" style="font-size:12px">⏱ {{ c.min }} min</div>
        <button class="btn btn--ghost" style="margin-top:12px;width:100%">Empezar</button>
      </div>
    </div>
  </section>
</template>
