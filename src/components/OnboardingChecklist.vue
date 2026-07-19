<script setup>
// Checklist "Tus primeros pasos" por rol. Learn-by-doing: al ir a un módulo se marca hecho.
// Persistente en localStorage por cliente+rol. Descartable.
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useClient } from '../stores/client'
import { onboardingFor } from '../content/help'

const client = useClient()
const router = useRouter()
const plan = computed(() => onboardingFor(client.role))
const key = computed(() => `geoos:onboarding:${client.id}:${client.role?.id || 'x'}`)

function load() { try { return JSON.parse(localStorage.getItem(key.value) || '{}') } catch { return {} } }
const state = ref(load())
function save() { try { localStorage.setItem(key.value, JSON.stringify(state.value)) } catch {} }

const done = computed(() => state.value.done || [])
const dismissed = computed(() => !!state.value.dismissed)
const total = computed(() => plan.value.steps.length)
const completed = computed(() => plan.value.steps.filter(s => done.value.includes(s.id)).length)
const pct = computed(() => total.value ? Math.round(completed.value / total.value * 100) : 0)
const allDone = computed(() => completed.value === total.value)

function toggle(id) {
  const d = new Set(done.value)
  d.has(id) ? d.delete(id) : d.add(id)
  state.value = { ...state.value, done: [...d] }; save()
}
function go(step) {
  if (!done.value.includes(step.id)) toggle(step.id)
  if (step.module) router.push({ name: step.module })
}
function dismiss() { state.value = { ...state.value, dismissed: true }; save() }
function reopen() { state.value = { ...state.value, dismissed: false }; save() }
</script>

<template>
  <div v-if="!dismissed" class="ob card">
    <div class="ob__h">
      <div>
        <strong>🚀 {{ plan.title }}</strong>
        <div class="muted" style="font-size:12px;margin-top:2px">{{ completed }}/{{ total }} completado · aprende usando</div>
      </div>
      <button class="link" @click="dismiss">Ocultar</button>
    </div>
    <div class="track"><div class="fill" :style="{ width: pct + '%' }"></div></div>

    <div v-if="allDone" class="ob__done">✓ ¡Onboarding completado! Ya dominas lo básico de tu rol.</div>

    <ul class="ob__list">
      <li v-for="s in plan.steps" :key="s.id" :class="{ ok: done.includes(s.id) }">
        <button class="chk" @click="toggle(s.id)" :aria-label="'marcar ' + s.label">{{ done.includes(s.id) ? '✓' : '' }}</button>
        <div class="ob__txt">
          <div class="ob__label">{{ s.label }}</div>
          <div class="muted" style="font-size:12px">{{ s.hint }}</div>
        </div>
        <button v-if="s.module" class="mini" @click="go(s)">Ir →</button>
      </li>
    </ul>
  </div>

  <button v-else class="reopen" @click="reopen">🚀 Ver mis primeros pasos ({{ completed }}/{{ total }})</button>
</template>

<style scoped>
.ob{margin-bottom:22px;border-left:3px solid var(--brand-primary)}
.ob__h{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px}
.ob__h strong{font-family:'Barlow';font-size:15px}
.link{border:none;background:transparent;color:var(--muted);font-size:12px;cursor:pointer}
.track{height:6px;background:var(--brand-bg);border-radius:99px;overflow:hidden;margin-bottom:12px}
.fill{height:100%;background:var(--brand-primary);border-radius:99px;transition:width .4s}
.ob__done{background:#EAF6EF;color:#1E9E6A;border-radius:8px;padding:8px 11px;font-size:13px;margin-bottom:10px}
.ob__list{list-style:none;margin:0;padding:0}
.ob__list li{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--line)}
.ob__list li:last-child{border-bottom:none}
.chk{width:22px;height:22px;min-width:22px;border:1.5px solid var(--line);border-radius:6px;background:transparent;cursor:pointer;color:var(--brand-primary);font-weight:800;font-size:13px}
li.ok .chk{background:var(--brand-primary);color:#fff;border-color:var(--brand-primary)}
li.ok .ob__label{text-decoration:line-through;color:var(--muted)}
.ob__txt{flex:1}
.ob__label{font-size:14px;font-weight:600}
.mini{border:1px solid var(--line);background:transparent;border-radius:6px;padding:4px 10px;font-size:12px;cursor:pointer;color:var(--brand-primary)}
.reopen{margin-bottom:18px;border:1px dashed var(--line);background:var(--brand-surface);border-radius:8px;padding:8px 12px;font-size:13px;cursor:pointer;color:var(--brand-ink)}
</style>
