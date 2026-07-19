// CONTRATO DE DATOS del feed (la "tabla única" que llena el pipeline de Relevant).
// Fuente de verdad única para: (a) el validador runtime que avisa de secciones
// vacías/ausentes, y (b) la documentación que Relevant debe cumplir por tenant.
// El core NO cambia entre clientes: solo cambia el contenido del feed.
//
// kind: 'array'  → se espera lista con >=1 item para considerarse "poblada".
//       'object' → se espera objeto con al menos una clave "de datos" poblada.
// module: id del módulo del registry que consume la sección (para el cockpit).
// state_field: si los items declaran su estado real/cualitativo/pendiente.
export const FEED_SECTIONS = [
  { key: 'kpis',                kind: 'array',  module: 'torre',        state_field: true,  desc: 'Tarjetas KPI de la Torre (id,label,value,unit,state,hint).' },
  { key: 'visibility_by_engine', kind: 'object', module: 'visibilidad', state_field: true,  desc: 'Visibilidad por motor (labels[], brand[], note).' },
  { key: 'brand_vs_link',       kind: 'array',  module: 'brand-link',   state_field: true,  desc: 'Menciones vs enlaces por marca (brand,mentions,links,state).' },
  { key: 'authority',           kind: 'array',  module: 'autoridad',    state_field: true,  desc: 'Autoridad de dominio (domain,dr,dir,backlinks,refdomains,dofollow_pct,state).' },
  { key: 'prompts_bank',        kind: 'array',  module: 'prompts',      state_field: true,  desc: 'Banco de prompts (cluster,prompt,volume,criticidad,presence,state).' },
  { key: 'competitors',         kind: 'array',  module: 'competidores', state_field: false, desc: 'Competidores (name,ai_visibility,citation_share,authority,is_brand).' },
  { key: 'alerts',              kind: 'array',  module: 'riesgo',       state_field: true,  desc: 'Alertas (severity,domain,trigger,owner,sla_h,state).' },
  { key: 'actions',             kind: 'array',  module: 'action-queue', state_field: false, desc: 'Semilla de la Action Queue (title,origin,owner,impact,due,status).' },
  { key: 'cycle',               kind: 'object', module: 'ciclo',        state_field: true,  desc: 'Caso del Ciclo GEO (case,score_before,score_after,steps[],state).' },
  { key: 'narratives',          kind: 'object', module: 'narrativas',   state_field: true,  desc: 'Capas narrativas + claims (layers[],claims[]).' },
  { key: 'ga4_ai_traffic',      kind: 'array',  module: 'trafico-ia',   state_field: true,  desc: 'Tráfico IA GA4 (brand,engine,landing,sessions,state).' },
  { key: 'local_horeca',        kind: 'array',  module: 'horeca',       state_field: true,  desc: 'Señales HORECA (poi,gbp_score,reviews,opportunity,state).' },
  { key: 'serp',                kind: 'object', module: 'ai-overview',  state_field: true,  desc: 'SERP/AIO (keyword,aio_present,aio_cites_brand,organic[],paa[],state).' },
  { key: 'agents',              kind: 'array',  module: 'agentes',      state_field: false, desc: 'Agentes (name,role,status,last).' },
  { key: 'training',            kind: 'array',  module: 'formacion',    state_field: false, desc: 'Cursos (course,role,min).' },
  { key: 'reporting',           kind: 'array',  module: 'reporting',    state_field: false, desc: 'Cadencia de reporting (cadence,artifact,owner,channel).' },
  { key: 'sources',             kind: 'array',  module: 'fuentes',      state_field: false, desc: 'Fuentes/proveedores (provider,feeds,modules,status,last_update).' }
]

// Metadatos de cabecera que todo feed debe traer.
export const FEED_META = ['client_id', 'period', 'as_of', 'source']

function isPopulated(section, value) {
  if (value == null) return false
  if (section.kind === 'array') return Array.isArray(value) && value.length > 0
  // object: al menos una clave con contenido no vacío (ignora state/note)
  if (typeof value !== 'object') return false
  return Object.entries(value).some(([k, v]) =>
    !['state', 'note'].includes(k) &&
    v != null && (Array.isArray(v) ? v.length > 0 : true))
}

// Valida un feed contra el contrato. No lanza: devuelve un informe accionable
// para que el operador SEPA que una sección está vacía (no un módulo mudo).
export function validateFeed(feed) {
  const f = feed || {}
  const meta_missing = FEED_META.filter(k => f[k] == null || f[k] === '')
  const sections = FEED_SECTIONS.map(s => ({
    key: s.key, module: s.module, desc: s.desc,
    present: Object.prototype.hasOwnProperty.call(f, s.key),
    populated: isPopulated(s, f[s.key])
  }))
  const empty = sections.filter(s => !s.populated)
  return {
    ok: meta_missing.length === 0 && empty.length === 0,
    meta_missing,
    total: sections.length,
    populated_count: sections.length - empty.length,
    empty_sections: empty.map(s => s.key),
    sections
  }
}
