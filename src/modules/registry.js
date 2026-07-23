// Registro unico de modulos. Router y navegacion se construyen a partir de aqui.
// origin: de donde viene la funcionalidad (GEO-OS | RT | Relevant | Charlie).
export const registry = [
  { id: 'torre',        path: '/torre',        title: 'Torre de Control',     group: 'Torre',      icon: '◎', origin: 'GEO-OS+Charlie', comp: () => import('./TorreControl.vue') },
  { id: 'ciclo',        path: '/ciclo',        title: 'Ciclo GEO',            group: 'Torre',      icon: '↻', origin: 'GEO-OS',         comp: () => import('./CicloGEO.vue') },
  { id: 'visibilidad',  path: '/visibilidad',  title: 'Visibilidad IA / GEO Twin', group: 'Análisis', icon: '👁', origin: 'GEO-OS+RT', comp: () => import('./VisibilidadIA.vue') },
  { id: 'data-ia',      path: '/data-ia',      title: 'Data Resultados IA',   group: 'Análisis',   icon: '⌕', origin: 'RT',             comp: () => import('./DataResultadosIA.vue') },
  { id: 'brand-link',   path: '/brand-link',   title: 'Brand vs Link Presence', group: 'Análisis', icon: '⚖', origin: 'Relevant',      comp: () => import('./BrandVsLink.vue') },
  { id: 'prompts',      path: '/prompts',      title: 'Prompts & Tracking',   group: 'Análisis',   icon: '❝', origin: 'GEO-OS+RT+Relevant', comp: () => import('./PromptsTracking.vue') },
  { id: 'narrativas',   path: '/narrativas',   title: 'Narrativas & Claims',  group: 'Análisis',   icon: '¶', origin: 'GEO-OS+Relevant', comp: () => import('./Narrativas.vue') },
  { id: 'autoridad',    path: '/autoridad',    title: 'Autoridad / ORM',      group: 'Análisis',   icon: '★', origin: 'RT+Relevant',    comp: () => import('./Autoridad.vue') },
  { id: 'trafico-ia',   path: '/trafico-ia',   title: 'Tráfico IA (GA4)',     group: 'Análisis',   icon: '📈', origin: 'Relevant',      comp: () => import('./TraficoIA.vue') },
  { id: 'competidores', path: '/competidores', title: 'Competidores',         group: 'Análisis',   icon: '⚔', origin: 'Charlie',        comp: () => import('./Competidores.vue') },
  { id: 'horeca',       path: '/horeca',       title: 'Local / HORECA',       group: 'Análisis',   icon: '📍', origin: 'Charlie+Relevant', comp: () => import('./LocalHoreca.vue') },
  { id: 'ai-overview',  path: '/ai-overview',  title: 'AI Overview / SERP',   group: 'Análisis',   icon: '🔍', origin: 'RT',            comp: () => import('./AIOverview.vue') },
  { id: 'fuentes',      path: '/fuentes',      title: 'Fuentes & Datos',      group: 'Análisis',   icon: '🔌', origin: 'RT+Relevant',    comp: () => import('./FuentesDatos.vue') },
  { id: 'action-queue', path: '/action-queue', title: 'Action Queue',         group: 'Operación',  icon: '☑', origin: 'Charlie',        comp: () => import('./ActionQueue.vue') },
  { id: 'riesgo',       path: '/riesgo',       title: 'Riesgo & Alertas',     group: 'Operación',  icon: '⚠', origin: 'GEO-OS+Relevant', comp: () => import('./RiesgoAlertas.vue') },
  { id: 'agentes',      path: '/agentes',      title: 'Agentes & Automatización', group: 'Operación', icon: '🤖', origin: 'GEO-OS',      comp: () => import('./Agentes.vue') },
  { id: 'gobierno',     path: '/gobierno',     title: 'Gobierno & Roles',     group: 'Operación',  icon: '⚙', origin: 'GEO-OS',         comp: () => import('./Gobierno.vue') },
  { id: 'costes',       path: '/costes',       title: 'Costes & Uso',         group: 'Operación',  icon: '💳', origin: 'GEO-OS', requiresFullAccess: true, comp: () => import('./Costes.vue') },
  { id: 'parametrizacion', path: '/parametrizacion', title: 'Parametrización', group: 'Plataforma', icon: '🎛', origin: 'GEO-OS', requiresFullAccess: true, comp: () => import('./Parametrizacion.vue') },
  { id: 'formacion',    path: '/formacion',    title: 'Formación',            group: 'Operación',  icon: '🎓', origin: 'GEO-OS',        comp: () => import('./Formacion.vue') },
  { id: 'adopcion',     path: '/adopcion',     title: 'Adopción',             group: 'Operación',  icon: '📊', origin: 'GEO-OS', requiresFullAccess: true, comp: () => import('./Adopcion.vue') },
  { id: 'reporting',    path: '/reporting',    title: 'Reporting',            group: 'Operación',  icon: '📄', origin: 'GEO-OS+Relevant', comp: () => import('./Reporting.vue') },
  { id: 'alta-cliente', path: '/alta-cliente', title: 'Alta de Cliente',      group: 'Plataforma', icon: '✚', origin: 'GEO-OS', requiresPlatformAdmin: true, comp: () => import('./AltaCliente.vue') }
]

export const registryById = Object.fromEntries(registry.map(m => [m.id, m]))
