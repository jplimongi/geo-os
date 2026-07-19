<script setup>
// Panel de PARAMETRIZACIÓN — un usuario funcional edita la config del cliente
// (identidad, marcas, competidores, roles/accesos, KPI targets) y los prompts
// monitorizados, SIN tocar JSON ni terminal. Persiste vía backend y aplica en caliente.
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useClient } from '../stores/client'
import { api } from '../api'
import { registry } from './registry'

const client = useClient()
const route = useRoute()
const tabs = [
  { id: 'identidad', label: 'Identidad & white-label' },
  { id: 'marcas', label: 'Marcas & competidores' },
  { id: 'roles', label: 'Roles & accesos' },
  { id: 'kpis', label: 'KPI targets' },
  { id: 'prompts', label: 'Prompts monitorizados' },
  { id: 'conexiones', label: 'Conexiones' }
]
// Permite aterrizar en una pestaña concreta vía ?tab= (p.ej. desde Gobierno & Roles).
const tab = ref(tabs.some(t => t.id === route.query.tab) ? route.query.tab : 'identidad')

const online = ref(false)
const busy = ref(false)
const msg = ref(null)  // {ok|err, text}

// Borradores editables (copias profundas: no tocan el store hasta guardar).
const clone = (o) => JSON.parse(JSON.stringify(o ?? null))
const d = reactive({ brand: {}, brands: [], competitors: [], roles: [], kpi_targets: {}, disabled_modules: [], data_source: {} })
const prompts = ref([])

// Conexiones (estado + formularios; las llaves nunca se leen del servidor)
const conn = ref({ llm: { configured: false }, providers: {} })
const llmForm = reactive({ provider: 'anthropic', model: '', key: '' })
const provForm = reactive({}) // { <providerName>: keyInput }
const connMsg = ref(null)
async function loadConnections() {
  if (!online.value) return
  conn.value = await api.getConnections(client.id).catch(() => conn.value)
  llmForm.provider = conn.value.llm.provider || 'anthropic'
  llmForm.model = conn.value.llm.model || ''
}
const dataProviders = computed(() => (client.feed?.sources || []).map(s => s.provider))
async function saveLlmKey() {
  connMsg.value = null
  try {
    const r = await api.setLlmKey(client.id, { provider: llmForm.provider, key: llmForm.key, model: llmForm.model || undefined })
    conn.value.llm = r.llm; llmForm.key = ''
    connMsg.value = { ok: true, text: 'Credencial LLM guardada (no se muestra por seguridad).' }
  } catch (e) { connMsg.value = { ok: false, text: e.message } }
}
async function clearLlmKey() {
  try { const r = await api.setLlmKey(client.id, { key: '' }); conn.value.llm = r.llm; connMsg.value = { ok: true, text: 'Credencial LLM del cliente eliminada.' } }
  catch (e) { connMsg.value = { ok: false, text: e.message } }
}
async function saveProviderKey(name) {
  try { await api.setProviderKey(client.id, name, provForm[name] || ''); provForm[name] = ''; await loadConnections(); connMsg.value = { ok: true, text: `Credencial de ${name} guardada.` } }
  catch (e) { connMsg.value = { ok: false, text: e.message } }
}

// Módulos disponibles para el selector de "qué ve cada rol".
const allModules = registry.map(m => ({ id: m.id, title: m.title }))
const kpiLabels = {
  ai_visibility: 'AI Visibility (%)', citation_share: 'Citation Share (%)', factual_accuracy: 'Factual Accuracy (%)',
  narrative_alignment: 'Narrative Alignment', reputational_risk: 'Reputational Risk (máx=peor)',
  content_gap: 'Content Gap (%)', correction_time_h: 'Tiempo corrección (h)'
}

function loadDrafts() {
  const c = client.config || {}
  d.brand = clone(c.brand) || { name: '', primary: '#DC0019', ink: '#222629', accent: '#9a7400', white_label: '', powered_by: '' }
  d.brands = clone(c.brands) || []
  d.competitors = clone(c.competitors) || []
  d.roles = clone(c.roles) || []
  d.kpi_targets = clone(c.kpi_targets) || {}
  d.disabled_modules = clone(c.disabled_modules) || []
  d.data_source = clone(c.data_source) || { type: 'bigquery', ref: '' }
  prompts.value = clone(client.feed?.prompts_bank) || []
}
onMounted(async () => { online.value = await api.health(); loadDrafts(); await loadConnections() })
watch(() => client.config, loadDrafts)

// --- editores de listas simples ---
function addTo(arr, val = '') { arr.push(val) }
function rm(arr, i) { arr.splice(i, 1) }

// --- roles ---
function addRole() {
  d.roles.push({ id: 'rol' + (d.roles.length + 1), label: 'Nuevo rol', credential: { user: '', pass: '' }, sees: [], landing: 'torre', platform_admin: false })
}
function toggleAll(role) { role.sees = role.sees === 'all' ? [] : 'all' }
function moduleChecked(role, id) { return role.sees === 'all' || (Array.isArray(role.sees) && role.sees.includes(id)) }
function toggleModule(role, id) {
  if (role.sees === 'all') return
  const i = role.sees.indexOf(id)
  i >= 0 ? role.sees.splice(i, 1) : role.sees.push(id)
}

// --- prompts ---
function addPrompt() { prompts.value.push({ cluster: '', prompt: '', criticidad: 'Media', presence: 'ausente', state: 'pendiente' }) }

const adminOk = computed(() => d.roles.some(r => r.platform_admin === true || r.sees === 'all'))
const canSave = computed(() => online.value && d.brand.name && adminOk.value && d.roles.every(r => r.id && r.credential?.user))

async function save() {
  busy.value = true; msg.value = null
  try {
    const newConfig = {
      ...client.config,
      brand: d.brand, brands: d.brands.filter(Boolean), competitors: d.competitors.filter(Boolean),
      roles: d.roles, kpi_targets: d.kpi_targets, disabled_modules: d.disabled_modules, data_source: d.data_source
    }
    await client.saveConfig(newConfig)
    await client.saveFeedPatch({ prompts_bank: prompts.value })
    msg.value = { ok: true, text: 'Parametrización guardada y aplicada.' }
  } catch (e) {
    msg.value = { ok: false, text: e.message }
  } finally { busy.value = false }
}
function reset() { loadDrafts(); msg.value = null }
</script>

<template>
  <section>
    <h1 class="section-title">🎛 Parametrización</h1>
    <p class="muted" style="margin:6px 0 16px">
      Configura la herramienta sin tocar ficheros. Los cambios se guardan y aplican al instante.
      Backend: <strong :style="{ color: online ? 'var(--ok)':'var(--warn)' }">{{ online ? 'conectado' : 'apagado (guardado no disponible)' }}</strong>.
    </p>

    <div class="tabs">
      <button v-for="t in tabs" :key="t.id" class="tab" :class="{ on: tab===t.id }" @click="tab=t.id">{{ t.label }}</button>
    </div>

    <div class="card">
      <!-- IDENTIDAD -->
      <div v-if="tab==='identidad'" class="form">
        <label>Nombre del cliente<input v-model="d.brand.name" /></label>
        <div class="row">
          <label>Color primario<input v-model="d.brand.primary" type="color" /></label>
          <label>Tinta (texto/sidebar)<input v-model="d.brand.ink" type="color" /></label>
          <label>Acento<input v-model="d.brand.accent" type="color" /></label>
        </div>
        <label>White-label (marca visible)<input v-model="d.brand.white_label" /></label>
        <label>Powered by<input v-model="d.brand.powered_by" /></label>
        <p class="muted" style="font-size:12px">Al guardar, el tema (colores, título) se reaplica sin recargar.</p>
      </div>

      <!-- MARCAS & COMPETIDORES -->
      <div v-if="tab==='marcas'">
        <div class="two">
          <div>
            <h3>Marcas a monitorizar</h3>
            <div v-for="(b,i) in d.brands" :key="'b'+i" class="line">
              <input v-model="d.brands[i]" placeholder="Marca" /><button class="x" @click="rm(d.brands,i)">✕</button>
            </div>
            <button class="btn btn--ghost" @click="addTo(d.brands)">+ Añadir marca</button>
          </div>
          <div>
            <h3>Competidores</h3>
            <div v-for="(c,i) in d.competitors" :key="'c'+i" class="line">
              <input v-model="d.competitors[i]" placeholder="Competidor" /><button class="x" @click="rm(d.competitors,i)">✕</button>
            </div>
            <button class="btn btn--ghost" @click="addTo(d.competitors)">+ Añadir competidor</button>
          </div>
        </div>
      </div>

      <!-- ROLES & ACCESOS -->
      <div v-if="tab==='roles'">
        <div v-for="(r,ri) in d.roles" :key="'r'+ri" class="rolecard">
          <div class="row">
            <label>Etiqueta<input v-model="r.label" /></label>
            <label>ID<input v-model="r.id" /></label>
            <label>Usuario<input v-model="r.credential.user" /></label>
            <label>Contraseña<input v-model="r.credential.pass" type="text" placeholder="(vacío = sin pass)" /></label>
          </div>
          <div class="row" style="align-items:center;margin-top:8px">
            <label class="chk"><input type="checkbox" :checked="r.platform_admin===true" @change="r.platform_admin=$event.target.checked" /> Admin de plataforma</label>
            <label class="chk"><input type="checkbox" :checked="r.sees==='all'" @change="toggleAll(r)" /> Ve todos los módulos</label>
            <label>Aterriza en
              <select v-model="r.landing">
                <option v-for="m in allModules" :key="m.id" :value="m.id">{{ m.title }}</option>
              </select>
            </label>
            <button class="x" style="margin-left:auto" @click="rm(d.roles,ri)" v-if="d.roles.length>1">Eliminar rol</button>
          </div>
          <div v-if="r.sees!=='all'" class="mods">
            <span class="muted" style="font-size:11px;display:block;margin-bottom:6px">Módulos visibles para este rol:</span>
            <label v-for="m in allModules" :key="m.id" class="modchk">
              <input type="checkbox" :checked="moduleChecked(r,m.id)" @change="toggleModule(r,m.id)" />{{ m.title }}
            </label>
          </div>
        </div>
        <button class="btn btn--ghost" @click="addRole">+ Añadir rol</button>
        <p v-if="!adminOk" class="muted" style="color:var(--warn);font-size:12px;margin-top:10px">⚠ Debe haber al menos un rol con acceso total o admin de plataforma.</p>
      </div>

      <!-- KPI TARGETS -->
      <div v-if="tab==='kpis'" class="form">
        <div class="row" style="flex-wrap:wrap">
          <label v-for="(v,k) in d.kpi_targets" :key="k" style="min-width:180px">
            {{ kpiLabels[k] || k }}
            <input v-model.number="d.kpi_targets[k]" type="number" />
          </label>
        </div>
        <p class="muted" style="font-size:12px">Objetivos por KPI. La Torre compara el valor real del feed contra estos targets.</p>
      </div>

      <!-- PROMPTS -->
      <div v-if="tab==='prompts'">
        <h3>Prompts monitorizados</h3>
        <p class="muted" style="font-size:12px;margin-bottom:10px">Los prompts que la herramienta vigila. Los resultados medidos los llena el pipeline; aquí curas qué se monitoriza.</p>
        <table class="tbl">
          <thead><tr><th>Cluster</th><th>Prompt</th><th>Criticidad</th><th>Presencia</th><th></th></tr></thead>
          <tbody>
            <tr v-for="(p,i) in prompts" :key="'p'+i">
              <td><input v-model="p.cluster" /></td>
              <td><input v-model="p.prompt" style="min-width:240px" /></td>
              <td><select v-model="p.criticidad"><option>CRÍTICA</option><option>Alta</option><option>Media</option><option>Baja</option></select></td>
              <td><select v-model="p.presence"><option>ausente</option><option>mencionada</option><option>citada</option></select></td>
              <td><button class="x" @click="rm(prompts,i)">✕</button></td>
            </tr>
          </tbody>
        </table>
        <button class="btn btn--ghost" style="margin-top:10px" @click="addPrompt">+ Añadir prompt</button>
      </div>

      <!-- CONEXIONES -->
      <div v-if="tab==='conexiones'">
        <h3>Motor de re-medición (LLM)</h3>
        <p class="muted" style="font-size:12px;margin-bottom:10px">
          La API key se guarda cifrada en el servidor y <strong>nunca se muestra</strong>. Estado:
          <strong :style="{ color: conn.llm.configured ? 'var(--ok)':'var(--warn)' }">
            {{ conn.llm.configured ? `configurada (${conn.llm.provider}${conn.llm.source==='env' ? ', vía servidor' : ''})` : 'sin configurar' }}
          </strong>
        </p>
        <div class="row" style="max-width:640px">
          <label>Proveedor<select v-model="llmForm.provider"><option value="anthropic">Anthropic</option><option value="openai">OpenAI</option></select></label>
          <label>Modelo<input v-model="llmForm.model" :placeholder="llmForm.provider==='anthropic' ? 'claude-sonnet-5' : 'gpt-4o-mini'" /></label>
          <label style="flex:1;min-width:220px">API key (solo escritura)<input v-model="llmForm.key" type="password" placeholder="sk-…" /></label>
        </div>
        <div style="margin-top:10px;display:flex;gap:10px">
          <button class="btn" :disabled="!online || !llmForm.key" @click="saveLlmKey">Guardar credencial</button>
          <button class="btn btn--ghost" v-if="conn.llm.configured && conn.llm.source==='client'" @click="clearLlmKey">Eliminar credencial del cliente</button>
        </div>

        <h3 style="margin-top:24px">Tabla única de datos (data_source)</h3>
        <div class="row" style="max-width:640px">
          <label>Tipo<select v-model="d.data_source.type"><option>bigquery</option><option>endpoint</option><option>fichero</option></select></label>
          <label style="flex:1;min-width:240px">Referencia (dataset / URL)<input v-model="d.data_source.ref" placeholder="geo_mahou (BigQuery)" /></label>
        </div>
        <p class="muted" style="font-size:12px">El puntero al dataset del cliente. Se guarda con el botón «Guardar cambios» de abajo.</p>

        <h3 style="margin-top:24px">Credenciales de proveedores de datos</h3>
        <p class="muted" style="font-size:12px;margin-bottom:10px">Server-side, nunca en el navegador. Normalmente las gestiona el pipeline de Relevant; aquí puedes fijarlas por cliente si operáis la ingesta vosotros.</p>
        <div v-for="p in dataProviders" :key="p" class="line" style="max-width:640px">
          <span style="min-width:150px;font-size:13px"><strong>{{ p }}</strong>
            <span class="pill" :style="{ background: conn.providers[p]?.configured ? '#EAF6EF':'#EEF1F6', color: conn.providers[p]?.configured ? '#1E9E6A':'#5B6B82' }">
              {{ conn.providers[p]?.configured ? 'configurada' : 'sin key' }}</span>
          </span>
          <input v-model="provForm[p]" type="password" placeholder="API key…" style="flex:1" />
          <button class="btn btn--ghost" :disabled="!online" @click="saveProviderKey(p)">Guardar</button>
        </div>

        <div v-if="connMsg" :class="['flag', connMsg.ok ? 'ok':'err']" style="margin-top:12px">{{ connMsg.ok ? '✓ ' : '⚠ ' }}{{ connMsg.text }}</div>
      </div>
    </div>

    <!-- barra de guardado -->
    <div class="savebar">
      <button class="btn" :disabled="!canSave || busy" @click="save">{{ busy ? 'Guardando…' : 'Guardar cambios' }}</button>
      <button class="btn btn--ghost" :disabled="busy" @click="reset">Descartar</button>
      <span v-if="!online" class="muted" style="font-size:12px">Arranca el backend para poder guardar.</span>
      <span v-if="msg" :class="['flag', msg.ok ? 'ok':'err']">{{ msg.ok ? '✓ ' : '⚠ ' }}{{ msg.text }}</span>
    </div>
  </section>
</template>

<style scoped>
.tabs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px}
.tab{padding:8px 14px;border:1px solid var(--line);border-radius:999px;background:var(--brand-surface);font-size:13px;color:var(--muted);cursor:pointer}
.tab.on{border-color:var(--brand-primary);color:var(--brand-primary);font-weight:600}
.form{display:flex;flex-direction:column;gap:12px;max-width:560px}
.row{display:flex;gap:12px;flex-wrap:wrap}
.two{display:grid;grid-template-columns:1fr 1fr;gap:24px}
label{display:flex;flex-direction:column;font-size:12px;color:var(--muted);gap:4px}
label.chk{flex-direction:row;align-items:center;font-size:13px;color:var(--brand-ink);gap:6px}
input,select{padding:9px 10px;border:1px solid var(--line);border-radius:8px;font-size:14px}
input[type=color]{padding:2px;height:40px;width:56px}
h3{font-family:'Barlow';font-size:14px;font-weight:600;margin:0 0 10px}
.line{display:flex;gap:8px;align-items:center;margin-bottom:8px}
.line input{flex:1}
.x{border:1px solid var(--line);background:transparent;border-radius:6px;padding:6px 9px;cursor:pointer;color:var(--muted);font-size:12px}
.rolecard{border:1px solid var(--line);border-radius:10px;padding:14px;margin-bottom:12px}
.mods{margin-top:10px;display:flex;flex-wrap:wrap;gap:8px}
.modchk{flex-direction:row;align-items:center;gap:5px;font-size:12px;color:var(--brand-ink);background:var(--brand-bg);border-radius:6px;padding:4px 8px}
.savebar{position:sticky;bottom:0;display:flex;align-items:center;gap:12px;padding:14px 0;margin-top:6px;background:linear-gradient(transparent,var(--brand-bg) 30%)}
.flag{font-size:13px}
.flag.ok{color:var(--ok)}
.flag.err{color:var(--warn)}
</style>
