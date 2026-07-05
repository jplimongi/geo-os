<script setup>
import { computed, ref, onMounted } from 'vue'
import { useClient } from '../stores/client'
import { useOps } from '../stores/ops'
import DataStateBadge from '../components/DataStateBadge.vue'

const client = useClient()
const ops = useOps()
const cy = computed(() => client.feed?.cycle || { steps: [] })
const active = ref(-1)
const actionId = ref(null)
const busy = ref(false)

// Prompt/marca reales del caso (0,0)
const prompt = computed(() => client.feed?.prompts_bank?.[0]?.prompt || 'mejor cerveza sin alcohol')
const brand = 'San Miguel'

onMounted(() => ops.init(client.id, client.feed))

const atEnd = computed(() => active.value >= cy.value.steps.length - 1)

async function advance() {
  if (atEnd.value || busy.value) return
  busy.value = true
  active.value++
  const step = cy.value.steps[active.value]
  try {
    if (step.name === 'Propone') {
      actionId.value = await ops.propose({ title: 'Landing + FAQ 0,0 optimizada para IA', origin: 'Ciclo GEO', owner: 'Content', impact: 'Alto', due: '2026-07-20' })
    } else if (step.name === 'Aprueba') {
      await ops.setStatus(actionId.value, 'en_curso', 'Claims aprobados por Squad GEO + Marca')
    } else if (step.name.startsWith('Ejecuta')) {
      await ops.setStatus(actionId.value, 'en_curso', 'Ejecutada vía capa MCP (agente Editor GEO)')
    } else if (step.name.startsWith('Re-mide')) {
      await ops.remeasure(actionId.value, prompt.value, brand, cy.value.score_after)
    }
  } finally { busy.value = false }
}
function reset() { active.value = -1; actionId.value = null; ops.lastRemeasure = null }
const rm = computed(() => ops.lastRemeasure)
</script>
<template>
  <section>
    <h1 class="section-title">↻ Ciclo GEO</h1>
    <p class="muted" style="margin:6px 0 16px">
      Ciclo cerrado Detecta → Re-mide. Caso: <strong>{{ cy.case }}</strong>
      · backend: <strong :style="{ color: ops.online ? 'var(--ok)':'var(--warn)' }">{{ ops.online ? 'conectado' : 'apagado' }}</strong>
      <DataStateBadge :state="ops.online ? 'real' : 'cualitativo'" />
    </p>

    <div class="card" style="margin-bottom:16px;display:flex;align-items:center;justify-content:space-between">
      <div>
        <div class="muted" style="font-size:12px;text-transform:uppercase">Marcador de visibilidad (caso)</div>
        <div style="font-family:'Barlow Condensed';font-size:44px;color:var(--brand-primary)">{{ ops.cycleScore }}<span style="font-size:20px">%</span></div>
      </div>
      <div style="display:flex;gap:10px">
        <button class="btn" @click="advance" :disabled="atEnd || busy">{{ busy ? '…' : 'Avanzar paso ▶' }}</button>
        <button class="btn btn--ghost" @click="reset">Reiniciar</button>
      </div>
    </div>

    <div class="steps">
      <div v-for="(s,i) in cy.steps" :key="s.n" class="step" :class="{ on: i <= active }">
        <div class="step__n">{{ s.n }}</div>
        <div><strong>{{ s.name }}</strong><div class="muted" style="font-size:13px">{{ s.desc }}</div></div>
      </div>
    </div>

    <div v-if="rm && !rm.error" class="card" style="margin-top:16px;border-left:4px solid var(--ok)">
      <strong>Resultado de re-medición real ({{ rm.engine }})</strong>
      <p style="margin:8px 0">{{ brand }} en “{{ rm.prompt }}”:
        <strong :style="{ color: rm.mentioned ? 'var(--ok)':'var(--warn)' }">{{ rm.mentioned ? 'CITADA / mencionada ✓' : 'AUSENTE ✗' }}</strong>
      </p>
      <p class="muted" style="font-size:12px;white-space:pre-wrap">{{ rm.answer_excerpt }}…</p>
      <p class="muted" style="font-size:11px;margin-top:6px">Medido: {{ rm.measured_at }}</p>
    </div>
    <div v-else-if="rm && rm.error" class="card" style="margin-top:16px;border-left:4px solid var(--warn)">
      <strong>Re-medición no ejecutada.</strong>
      <p class="muted" style="font-size:13px;margin-top:6px">
        Arranca el backend con API key: <code>npm run server</code> (con ANTHROPIC_API_KEY u OPENAI_API_KEY en .env).
      </p>
    </div>

    <div class="card" style="margin-top:16px" v-if="ops.log.length">
      <strong style="font-size:13px">Bitácora del loop</strong>
      <ul style="margin:8px 0 0;padding-left:16px;font-size:12px;color:var(--muted)">
        <li v-for="(l,i) in ops.log.slice(0,6)" :key="i">{{ l.t }} — {{ l.msg }}</li>
      </ul>
    </div>
    <p class="muted" style="font-size:12px;margin-top:12px">{{ cy.note }}</p>
  </section>
</template>
<style scoped>
.steps{display:flex;flex-direction:column;gap:10px}
.step{display:flex;gap:12px;align-items:center;padding:12px 14px;border:1px solid var(--line);border-radius:10px;background:var(--brand-surface);opacity:.5;transition:.2s}
.step.on{opacity:1;border-color:var(--brand-primary)}
.step__n{width:30px;height:30px;border-radius:50%;background:var(--brand-ink);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;flex:0 0 auto}
.step.on .step__n{background:var(--brand-primary)}
</style>
