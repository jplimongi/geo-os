<script setup>
// COSTES & USO por cliente — controla el gasto de cada cliente: consumo del mes por
// proveedor/modelo, presupuesto (aviso o bloqueo) y registro de uso externo.
import { ref, reactive, computed, onMounted } from 'vue'
import { useClient } from '../stores/client'
import { api } from '../api'

const client = useClient()
const online = ref(false)
const usage = ref(null)
const pricing = ref({})
const period = ref(new Date().toISOString().slice(0, 7))
const msg = ref(null)

const budget = reactive({ budget_usd_month: 0, mode: 'alert' })
const manual = reactive({ provider: '', cost_usd: null, units: '', note: '' })

async function load() {
  online.value = await api.health()
  if (!online.value) return
  usage.value = await api.getUsage(client.id, period.value).catch(() => null)
  pricing.value = await api.getPricing().catch(() => ({}))
  const b = usage.value?.budget || client.config?.cost_control || { budget_usd_month: 0, mode: 'alert' }
  budget.budget_usd_month = b.budget_usd_month || 0
  budget.mode = b.mode || 'alert'
}
onMounted(load)

const spent = computed(() => usage.value?.total_usd || 0)
const pct = computed(() => budget.budget_usd_month > 0 ? Math.min(100, Math.round(spent.value / budget.budget_usd_month * 100)) : 0)
const barColor = computed(() => pct.value >= 100 ? 'var(--danger,#D7263D)' : pct.value >= 80 ? 'var(--accent)' : 'var(--ok)')
const eur = (n) => '$' + (n ?? 0).toFixed(n < 1 && n > 0 ? 4 : 2)

async function saveBudget() {
  msg.value = null
  try {
    await client.saveConfig({ ...client.config, cost_control: { budget_usd_month: Number(budget.budget_usd_month) || 0, mode: budget.mode } })
    await load()
    msg.value = { ok: true, text: 'Presupuesto guardado.' }
  } catch (e) { msg.value = { ok: false, text: e.message } }
}
async function addManual() {
  if (!manual.provider || manual.cost_usd == null) return
  try {
    await api.addUsage(client.id, { provider: manual.provider, cost_usd: Number(manual.cost_usd), units: manual.units, note: manual.note, kind: 'data' })
    manual.provider = ''; manual.cost_usd = null; manual.units = ''; manual.note = ''
    await load(); msg.value = { ok: true, text: 'Uso registrado.' }
  } catch (e) { msg.value = { ok: false, text: e.message } }
}
async function savePricing() {
  try { await api.setPricing(pricing.value); msg.value = { ok: true, text: 'Precios guardados.' } }
  catch (e) { msg.value = { ok: false, text: e.message } }
}
function addModel() { pricing.value['nuevo-modelo'] = { in: 0, out: 0 } }
</script>

<template>
  <section>
    <h1 class="section-title">💳 Costes & Uso</h1>
    <p class="muted" style="margin:6px 0 16px">
      Control de gasto de <strong>{{ client.config?.brand?.name }}</strong>. Backend:
      <strong :style="{ color: online ? 'var(--ok)':'var(--warn)' }">{{ online ? 'conectado' : 'apagado' }}</strong>.
      <label style="margin-left:12px;font-size:13px">Periodo <input v-model="period" type="month" @change="load" style="padding:4px 8px" /></label>
    </p>

    <div v-if="!online" class="card">Arranca el backend para ver el consumo.</div>

    <template v-else-if="usage">
      <!-- resumen -->
      <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(200px,1fr));margin-bottom:16px">
        <div class="card">
          <div class="lbl muted">Gasto del mes</div>
          <div class="big">{{ eur(spent) }}</div>
          <div class="muted" style="font-size:12px">{{ usage.calls }} llamadas medidas</div>
        </div>
        <div class="card">
          <div class="lbl muted">Presupuesto</div>
          <div class="big">{{ budget.budget_usd_month ? eur(budget.budget_usd_month) : '—' }}</div>
          <div class="muted" style="font-size:12px">modo: <strong>{{ budget.mode === 'block' ? 'bloqueo' : 'aviso' }}</strong></div>
        </div>
        <div class="card" style="grid-column:span 2">
          <div class="lbl muted">Consumo vs presupuesto</div>
          <div class="track"><div class="fill" :style="{ width: pct + '%', background: barColor }"></div></div>
          <div class="muted" style="font-size:12px;margin-top:6px">{{ pct }}% usado <span v-if="pct>=100" style="color:var(--danger,#D7263D)">· límite alcanzado</span></div>
        </div>
      </div>

      <div class="grid" style="grid-template-columns:1fr 1fr;align-items:start;gap:16px">
        <div class="card">
          <h3>Por proveedor</h3>
          <table class="tbl"><tbody>
            <tr v-for="(v,k) in usage.by_provider" :key="k"><td>{{ k }}</td><td style="text-align:right"><strong>{{ eur(v) }}</strong></td></tr>
            <tr v-if="!Object.keys(usage.by_provider).length"><td class="muted">Sin consumo este periodo</td></tr>
          </tbody></table>
          <h3 style="margin-top:16px">Por modelo</h3>
          <table class="tbl"><tbody>
            <tr v-for="(v,k) in usage.by_model" :key="k"><td>{{ k }}</td><td style="text-align:right">{{ eur(v) }}</td></tr>
            <tr v-if="!Object.keys(usage.by_model).length"><td class="muted">—</td></tr>
          </tbody></table>
        </div>

        <div class="card">
          <h3>Presupuesto mensual</h3>
          <div class="row">
            <label>Límite (USD)<input v-model.number="budget.budget_usd_month" type="number" min="0" step="1" /></label>
            <label>Al alcanzarlo<select v-model="budget.mode"><option value="alert">Avisar (sigue midiendo)</option><option value="block">Bloquear re-medición</option></select></label>
          </div>
          <button class="btn" style="margin-top:10px" @click="saveBudget">Guardar presupuesto</button>

          <h3 style="margin-top:20px">Registrar uso externo (proveedores de datos)</h3>
          <p class="muted" style="font-size:12px">Para el coste de DataForSEO/SE Ranking/etc. (que llama el pipeline). Manual o vía API.</p>
          <div class="row">
            <label>Proveedor<input v-model="manual.provider" placeholder="DataForSEO" /></label>
            <label>Coste (USD)<input v-model.number="manual.cost_usd" type="number" step="0.01" /></label>
          </div>
          <div class="row">
            <label style="flex:1">Unidades<input v-model="manual.units" placeholder="500 queries" /></label>
            <label style="flex:1">Nota<input v-model="manual.note" /></label>
          </div>
          <button class="btn btn--ghost" style="margin-top:10px" @click="addManual" :disabled="!manual.provider || manual.cost_usd==null">Registrar uso</button>
        </div>
      </div>

      <!-- precios -->
      <div class="card" style="margin-top:16px">
        <h3>Tabla de precios (USD por 1M tokens) <span class="pill" style="background:#FCF3DA;color:#9a7400">verificar</span></h3>
        <p class="muted" style="font-size:12px">Los precios cambian; ajústalos aquí. Se usan para calcular el coste de cada re-medición.</p>
        <table class="tbl">
          <thead><tr><th>Modelo</th><th>Input</th><th>Output</th></tr></thead>
          <tbody>
            <tr v-for="(p,m) in pricing" :key="m">
              <td>{{ m }}</td>
              <td><input v-model.number="p.in" type="number" step="0.01" style="width:90px" /></td>
              <td><input v-model.number="p.out" type="number" step="0.01" style="width:90px" /></td>
            </tr>
          </tbody>
        </table>
        <div style="margin-top:10px;display:flex;gap:10px">
          <button class="btn btn--ghost" @click="addModel">+ Añadir modelo</button>
          <button class="btn" @click="savePricing">Guardar precios</button>
        </div>
      </div>

      <!-- recientes -->
      <div class="card" style="margin-top:16px" v-if="usage.recent?.length">
        <h3>Movimientos recientes</h3>
        <table class="tbl">
          <thead><tr><th>Fecha</th><th>Tipo</th><th>Proveedor</th><th>Modelo</th><th>Tokens</th><th style="text-align:right">Coste</th></tr></thead>
          <tbody>
            <tr v-for="(e,i) in usage.recent" :key="i">
              <td>{{ e.ts.slice(0,16).replace('T',' ') }}</td><td>{{ e.kind }}</td><td>{{ e.provider }}</td>
              <td>{{ e.model || '—' }}</td><td>{{ e.in_tokens != null ? (e.in_tokens + '/' + e.out_tokens) : (e.units || '—') }}</td>
              <td style="text-align:right"><strong>{{ eur(e.cost_usd) }}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="msg" :class="['flag', msg.ok ? 'ok':'err']" style="margin-top:12px">{{ msg.ok ? '✓ ' : '⚠ ' }}{{ msg.text }}</div>
    </template>
  </section>
</template>

<style scoped>
.lbl{font-size:12px;text-transform:uppercase;letter-spacing:.04em}
.big{font-family:'Barlow Condensed';font-size:34px;line-height:1.1}
.track{height:12px;background:var(--brand-bg);border-radius:99px;overflow:hidden;margin-top:8px}
.fill{height:100%;border-radius:99px;transition:width .4s}
h3{font-family:'Barlow';font-size:14px;font-weight:600;margin:0 0 10px}
.row{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:4px}
label{display:flex;flex-direction:column;font-size:12px;color:var(--muted);gap:4px}
input,select{padding:8px 10px;border:1px solid var(--line);border-radius:8px;font-size:14px}
.flag{font-size:13px}.flag.ok{color:var(--ok)}.flag.err{color:var(--warn)}
</style>
