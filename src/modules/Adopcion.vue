<script setup>
// ADOPCIÓN (Fase 3): panel para acceso total. Dos vistas: (1) certificación de la Academia
// por rol×ruta y (2) uso de módulos, destacando los INFRAUTILIZADOS (sin uso / poco uso)
// como oportunidad de adopción. Datos agregados por ROL (los logins son por rol).
import { ref, computed, onMounted } from 'vue'
import { api } from '../api'
import { useClient } from '../stores/client'
import { paths, pathsForRole } from '../content/academy'
import { registry } from '../modules/registry'

const client = useClient()
const data = ref(null)      // { roles, academy, modules, generated }
const loading = ref(true)
const error = ref(null)

onMounted(async () => {
  try { data.value = await api.getAdoption(client.id) }
  catch (e) { error.value = e.message }
  finally { loading.value = false }
})

const roles = computed(() => data.value?.roles || [])

// --- Certificación por rol ---
// Para cada rol, sus rutas aplicables (misma lógica que la Academia) con progreso y cert.
const certRows = computed(() => roles.value.map(r => {
  const applicable = pathsForRole(r)  // {id, sees, platform_admin?} basta para el gating
  const rp = data.value?.academy?.[r.id]?.paths || {}
  const cells = applicable.map(p => {
    const d = rp[p.id] || { done: [], cert: null }
    const total = p.lessons.length
    const done = (d.done || []).length
    return { id: p.id, title: p.title, icon: p.icon, done, total, pct: total ? Math.round(done / total * 100) : 0, cert: d.cert }
  })
  const certs = cells.filter(c => c.cert).length
  return { role: r, cells, certs, totalPaths: cells.length, updated: data.value?.academy?.[r.id]?.updated }
}))

// --- Uso de módulos ---
// Suma de aperturas por módulo (sobre todos los roles) + quién lo usa + último acceso.
const LOW = 3  // umbral "poco uso"
const moduleRows = computed(() => {
  const mods = data.value?.modules || {}
  const rows = registry.map(m => {
    let total = 0, last = null
    const byRole = []
    for (const r of roles.value) {
      const cell = mods[r.id]?.[m.id]
      if (cell?.count) {
        total += cell.count
        byRole.push({ label: r.label, count: cell.count })
        if (!last || cell.last > last) last = cell.last
      }
    }
    const level = total === 0 ? 'none' : total < LOW ? 'low' : 'ok'
    return { id: m.id, title: m.title, icon: m.icon, group: m.group, total, byRole, last, level }
  })
  // infrautilizados primero (sin uso, luego poco uso), después por total ascendente
  return rows.sort((a, b) => a.total - b.total)
})
const kpis = computed(() => {
  const rows = moduleRows.value
  return {
    total: rows.length,
    sinUso: rows.filter(r => r.level === 'none').length,
    pocoUso: rows.filter(r => r.level === 'low').length,
    certTotal: certRows.value.reduce((s, r) => s + r.certs, 0),
    certPosibles: certRows.value.reduce((s, r) => s + r.totalPaths, 0)
  }
})

function fdate(iso) { return iso ? iso.slice(0, 10) : '—' }
</script>

<template>
  <section>
    <h1 class="section-title">📊 Adopción</h1>
    <p class="muted" style="margin:6px 0 18px">
      Quién se ha formado y qué módulos se usan (y cuáles no). Datos por rol —
      los accesos de la plataforma son por rol, no por persona.
    </p>

    <div v-if="loading" class="card">Cargando…</div>
    <div v-else-if="error" class="card err">No se pudo cargar la adopción: {{ error }}</div>

    <template v-else>
      <!-- KPIs -->
      <div class="kpis">
        <div class="kpi"><div class="kpi__n">{{ kpis.certTotal }}/{{ kpis.certPosibles }}</div><div class="kpi__l">Rutas certificadas</div></div>
        <div class="kpi"><div class="kpi__n">{{ kpis.total }}</div><div class="kpi__l">Módulos</div></div>
        <div class="kpi" :class="{ warn: kpis.pocoUso }"><div class="kpi__n">{{ kpis.pocoUso }}</div><div class="kpi__l">Poco usados</div></div>
        <div class="kpi" :class="{ bad: kpis.sinUso }"><div class="kpi__n">{{ kpis.sinUso }}</div><div class="kpi__l">Sin uso</div></div>
      </div>

      <!-- Certificación por rol -->
      <div class="card">
        <h2>🎓 Formación por rol</h2>
        <div v-for="row in certRows" :key="row.role.id" class="rrow">
          <div class="rhead">
            <div>
              <strong>{{ row.role.label }}</strong>
              <span class="muted" style="font-size:12px"> · {{ row.role.user }}</span>
            </div>
            <div class="muted" style="font-size:12px">
              {{ row.certs }}/{{ row.totalPaths }} certificadas · act. {{ fdate(row.updated) }}
            </div>
          </div>
          <div class="chips">
            <div v-for="c in row.cells" :key="c.id" class="chip"
                 :class="{ done: c.cert, prog: !c.cert && c.done }">
              <span>{{ c.icon }} {{ c.title }}</span>
              <span class="chip__v" v-if="c.cert">✓ {{ c.cert.score }}%</span>
              <span class="chip__v" v-else>{{ c.done }}/{{ c.total }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Adopción de módulos -->
      <div class="card">
        <h2>🧭 Uso de módulos <span class="muted" style="font-size:12px;font-weight:400">· infrautilizados primero</span></h2>
        <div class="mgrid">
          <div v-for="m in moduleRows" :key="m.id" class="mcard" :class="m.level">
            <div class="mtop">
              <div class="mtitle">{{ m.icon }} {{ m.title }}</div>
              <div class="tag" :class="m.level">{{ m.level === 'none' ? 'sin uso' : m.level === 'low' ? 'poco uso' : 'ok' }}</div>
            </div>
            <div class="mmeta">
              <span class="mnum">{{ m.total }}</span> aperturas · <span class="muted">{{ m.group }}</span>
            </div>
            <div class="mroles">
              <span v-for="(b, i) in m.byRole" :key="i" class="rtag">{{ b.label }} · {{ b.count }}</span>
              <span v-if="!m.byRole.length" class="muted" style="font-size:12px">Ningún rol lo ha abierto todavía</span>
            </div>
            <div class="muted" style="font-size:11px;margin-top:6px">Último: {{ fdate(m.last) }}</div>
          </div>
        </div>
      </div>
    </template>
  </section>
</template>

<style scoped>
.err{color:#D7263D}
.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px}
.kpi{background:var(--brand-surface);border:1px solid var(--line);border-radius:12px;padding:14px 16px}
.kpi__n{font-family:'Barlow';font-size:24px;font-weight:700}
.kpi__l{color:var(--muted);font-size:12px;margin-top:2px}
.kpi.warn{border-color:#f0c674}.kpi.warn .kpi__n{color:#B8860B}
.kpi.bad{border-color:#f1b0b7}.kpi.bad .kpi__n{color:#D7263D}
.card{margin-bottom:16px}
h2{font-family:'Barlow';font-size:16px;margin:0 0 12px}
.rrow{border-top:1px solid var(--line);padding:12px 0}
.rrow:first-of-type{border-top:none}
.rhead{display:flex;justify-content:space-between;align-items:baseline;gap:12px;margin-bottom:8px;flex-wrap:wrap}
.chips{display:flex;gap:8px;flex-wrap:wrap}
.chip{display:flex;align-items:center;gap:8px;border:1px solid var(--line);border-radius:999px;padding:5px 12px;font-size:12px;color:var(--muted)}
.chip.prog{border-color:#f0c674;color:#8a6d0b}
.chip.done{border-color:#b8e6cd;background:#EAF6EF;color:#1E9E6A}
.chip__v{font-weight:700}
.mgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px}
.mcard{border:1px solid var(--line);border-radius:12px;padding:12px 14px;background:var(--brand-surface)}
.mcard.none{border-color:#f1b0b7;background:#FCEEF0}
.mcard.low{border-color:#f0c674;background:#FEF8EC}
.mtop{display:flex;justify-content:space-between;align-items:center;gap:8px}
.mtitle{font-size:14px;font-weight:600}
.mmeta{font-size:12px;color:var(--muted);margin:6px 0}
.mnum{font-family:'Barlow';font-size:18px;font-weight:700;color:var(--brand-primary)}
.mcard.none .mnum{color:#D7263D}.mcard.low .mnum{color:#B8860B}
.mroles{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px}
.rtag{font-size:11px;background:var(--brand-bg);border-radius:6px;padding:3px 8px;color:var(--muted)}
.tag{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.03em;border-radius:6px;padding:3px 8px;background:#EAF6EF;color:#1E9E6A}
.tag.none{background:#FBE7EA;color:#D7263D}
.tag.low{background:#FEF3D6;color:#B8860B}
</style>
