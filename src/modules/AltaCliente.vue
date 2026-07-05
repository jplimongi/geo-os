<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useClient } from '../stores/client'
import { api } from '../api'

const client = useClient()
const step = ref(1)
const steps = ['Identidad', 'Dominios & Competencia', 'Roles & Datos', 'Revisar & Crear']
const clients = ref([])
const online = ref(false)
const result = ref(null)   // {ok,id} | {error}
const busy = ref(false)

// ---- intake ----
const f = reactive({
  client_id: '', name: '', primary: '#2D6CDF', white_label: 'Relevant Traffic', powered_by: 'Cupperlab',
  domains: 'Corporativo, Marcas, Producto', brands: '', competitors: '',
  admin_user: 'admin', admin_pass: '', add_squad: true, add_operador: false,
  data_type: 'bigquery', data_ref: ''
})

onMounted(async () => {
  online.value = await api.health()
  if (online.value) clients.value = await api.listClients().catch(() => [])
})

// slug automático desde el nombre
function slugify(s) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}
function onName() { if (!f._touchedId) f.client_id = slugify(f.name) }

const listOf = (s) => s.split(',').map(x => x.trim()).filter(Boolean)

const config = computed(() => {
  const roles = [{ id: 'admin', label: `Administrador (${f.name})`, credential: { user: f.admin_user, pass: f.admin_pass }, sees: 'all', landing: 'torre', platform_admin: true }]
  if (f.add_squad) roles.push({ id: 'squad', label: 'Squad GEO', credential: { user: 'squad', pass: '' }, sees: 'all', landing: 'torre' })
  if (f.add_operador) roles.push({ id: 'operador', label: 'Operador', credential: { user: 'operador', pass: '' }, sees: ['torre', 'visibilidad', 'prompts', 'riesgo'], landing: 'torre' })
  return {
    client_id: f.client_id,
    brand: { name: f.name, primary: f.primary, white_label: f.white_label, powered_by: f.powered_by },
    domains_map: listOf(f.domains),
    brands: listOf(f.brands),
    competitors: listOf(f.competitors),
    kpi_targets: { ai_visibility: 80, citation_share: 25, factual_accuracy: 95, narrative_alignment: 70, reputational_risk: 40, content_gap: 50, correction_time_h: 48 },
    disabled_modules: [],
    roles,
    data_source: { type: f.data_type, ref: f.data_ref }
  }
})

const canNext = computed(() => {
  if (step.value === 1) return f.name && /^[a-z0-9-]+$/.test(f.client_id)
  if (step.value === 3) return f.admin_pass.length >= 4
  return true
})

async function create() {
  busy.value = true; result.value = null
  try {
    if (!online.value) { result.value = { offline: true }; return }
    result.value = await api.createClient(config.value)
    clients.value = await api.listClients().catch(() => clients.value)
  } catch (e) {
    result.value = { error: e.message }
  } finally { busy.value = false }
}
function download() {
  const blob = new Blob([JSON.stringify(config.value, null, 2)], { type: 'application/json' })
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'config.json'; a.click()
}
async function preview(id) { await client.switchTo(id); location.hash = '#/login' }
</script>

<template>
  <section>
    <h1 class="section-title">✚ Alta de Cliente</h1>
    <p class="muted" style="margin:6px 0 20px">
      Da de alta un cliente nuevo: genera su <code>config.json</code> y lo provisiona.
      Backend: <strong :style="{ color: online ? 'var(--ok)':'var(--warn)' }">{{ online ? 'conectado' : 'apagado (solo descarga)' }}</strong>.
    </p>

    <!-- stepper -->
    <div class="stepper">
      <div v-for="(s,i) in steps" :key="s" class="st" :class="{ on: step===i+1, done: step>i+1 }">
        <span class="st__n">{{ i+1 }}</span>{{ s }}
      </div>
    </div>

    <div class="card">
      <!-- 1. Identidad -->
      <div v-if="step===1" class="form">
        <label>Nombre del cliente<input v-model="f.name" @input="onName" placeholder="Cervezas Ejemplo" /></label>
        <label>ID (slug)<input v-model="f.client_id" @input="f._touchedId=true" placeholder="cervezas-ejemplo" /></label>
        <label>Color de marca<input v-model="f.primary" type="color" style="height:40px" /></label>
        <label>White-label (marca visible)<input v-model="f.white_label" /></label>
        <label>Powered by<input v-model="f.powered_by" /></label>
      </div>

      <!-- 2. Dominios & competencia -->
      <div v-if="step===2" class="form">
        <label>Mapa de dominios / verticales (separados por comas)<input v-model="f.domains" /></label>
        <label>Marcas a monitorizar<input v-model="f.brands" placeholder="Marca A, Marca B" /></label>
        <label>Competidores<input v-model="f.competitors" placeholder="Competidor 1, Competidor 2" /></label>
      </div>

      <!-- 3. Roles & datos -->
      <div v-if="step===3" class="form">
        <label>Usuario admin<input v-model="f.admin_user" /></label>
        <label>Contraseña admin (mín. 4)<input v-model="f.admin_pass" type="text" /></label>
        <label class="chk"><input type="checkbox" v-model="f.add_squad" /> Añadir rol Squad GEO</label>
        <label class="chk"><input type="checkbox" v-model="f.add_operador" /> Añadir rol Operador (acceso limitado)</label>
        <label>Fuente de datos (tabla única / dataset)<input v-model="f.data_ref" placeholder="geo_cervezas_ejemplo (BigQuery)" /></label>
        <p class="muted" style="font-size:12px">La provisión del dataset y el enchufe de proveedores (DataForSEO/SE Ranking/Ahrefs) la hace el pipeline de Relevant.</p>
      </div>

      <!-- 4. Revisar -->
      <div v-if="step===4">
        <p class="muted" style="font-size:13px;margin-top:0">Se creará <code>public/clients/{{ f.client_id }}/</code> con este config + un feed inicial vacío:</p>
        <pre class="code">{{ JSON.stringify(config, null, 2) }}</pre>
      </div>

      <!-- nav -->
      <div class="nav">
        <button class="btn btn--ghost" v-if="step>1" @click="step--">← Atrás</button>
        <span style="flex:1"></span>
        <button class="btn" v-if="step<4" @click="step++" :disabled="!canNext">Siguiente →</button>
        <button class="btn" v-if="step===4" @click="create" :disabled="busy">{{ busy ? 'Creando…' : 'Crear cliente' }}</button>
        <button class="btn btn--ghost" v-if="step===4" @click="download">Descargar config.json</button>
      </div>

      <!-- result -->
      <div v-if="result?.ok" class="banner ok">✓ Cliente “{{ result.id }}” creado y provisionado.
        <button class="mini" @click="preview(result.id)">Previsualizar →</button></div>
      <div v-if="result?.offline" class="banner warn">Backend apagado: se ha descargado el config.json. Arranca <code>npm run server</code> para provisionar automáticamente.</div>
      <div v-if="result?.error" class="banner warn">Error: {{ result.error }}</div>
    </div>

    <div class="card" style="margin-top:16px" v-if="clients.length">
      <strong style="font-size:14px">Clientes existentes ({{ clients.length }})</strong>
      <ul style="margin:10px 0 0;padding:0;list-style:none">
        <li v-for="c in clients" :key="c.id" style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--line)">
          <span><strong>{{ c.name }}</strong> <span class="muted">· {{ c.id }}</span></span>
          <button class="mini" @click="preview(c.id)">Abrir →</button>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.stepper{display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap}
.st{display:flex;align-items:center;gap:8px;padding:8px 12px;border:1px solid var(--line);border-radius:999px;font-size:13px;color:var(--muted);background:var(--brand-surface)}
.st.on{border-color:var(--brand-primary);color:var(--brand-primary);font-weight:600}
.st.done{color:var(--ok)}
.st__n{width:20px;height:20px;border-radius:50%;background:var(--brand-bg);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700}
.st.on .st__n{background:var(--brand-primary);color:#fff}
.form{display:flex;flex-direction:column;gap:12px;max-width:520px}
label{display:flex;flex-direction:column;font-size:12px;color:var(--muted);gap:4px}
label.chk{flex-direction:row;align-items:center;font-size:14px;color:var(--brand-ink)}
input{padding:9px 10px;border:1px solid var(--line);border-radius:8px;font-size:14px}
.nav{display:flex;align-items:center;gap:10px;margin-top:20px}
.code{background:#0f1115;color:#d6dae0;padding:14px;border-radius:8px;font-size:12px;max-height:340px;overflow:auto}
.banner{margin-top:14px;padding:10px 12px;border-radius:8px;font-size:14px}
.banner.ok{background:#EAF6EF;color:#1E9E6A}
.banner.warn{background:#FBE7EA;color:#D7263D}
.mini{border:1px solid currentColor;background:transparent;border-radius:6px;padding:3px 10px;font-size:12px;cursor:pointer;margin-left:10px}
</style>
