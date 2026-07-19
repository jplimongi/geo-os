// Capa de FORMACIÓN — contenido base (ES). Conocimiento de producto (igual entre clientes);
// lo específico de cada cliente (marcas, prompts) viene del feed. Ampliable y migrable a config.

// Glosario GEO / LLMO / GEO Twin — términos que un operador necesita entender.
export const glossary = [
  { term: 'GEO', def: 'Generative Engine Optimization: optimizar la presencia de la marca en las respuestas de motores de IA (ChatGPT, Perplexity, Gemini, Google AI Overviews), no solo en el buscador clásico.' },
  { term: 'LLMO', def: 'Large Language Model Optimization. Sinónimo operativo de GEO: posicionar la marca dentro de lo que responden los LLM.' },
  { term: 'AI Visibility Share', def: 'De cuántas respuestas de IA relevantes aparece la marca. Es la métrica de "cuánto nos ven" los motores generativos.' },
  { term: 'AI Citation Share', def: 'De las veces que aparecemos, en cuántas la IA cita una fuente propia (nuestra web). Mencionar no es citar: citar da control y autoridad.' },
  { term: 'GEO Twin', def: 'Réplica de cómo los motores de IA "ven" a la marca: qué dicen, qué citan y qué se equivocan, por motor y por prompt.' },
  { term: 'Brand vs Link', def: 'Contraste entre menciones de marca (nos nombran) y enlaces/citas a dominio propio. Mucha mención y poco enlace = riesgo de autoridad.' },
  { term: 'Content Gap', def: 'Prompts de alto volumen donde la marca no aparece ni es citada: el hueco de contenido a cubrir.' },
  { term: 'Narrative Alignment', def: 'Cuánto coincide lo que la IA cuenta de la marca con la narrativa que la marca quiere proyectar.' },
  { term: 'Reputational Risk', def: 'Errores factuales o narrativas negativas que la IA repite. A mayor valor, peor.' },
  { term: 'AI Overview / AIO', def: 'El bloque de respuesta generada por IA que Google muestra sobre los resultados. Si está presente y no nos cita, perdemos clic y autoridad.' },
  { term: 'Ciclo GEO', def: 'El bucle operativo: Detecta → Diagnostica → Propone → Aprueba → Ejecuta → Re-mide. Cierra el círculo entre hallazgo y resultado.' },
  { term: 'Action Queue', def: 'Cola persistente de acciones (pendiente / en curso / hecho). Es donde el trabajo del Ciclo GEO se hace tangible y se sigue.' },
  { term: 'Re-medición', def: 'Volver a preguntar al LLM el mismo prompt tras actuar, para comprobar si la marca ya aparece/se cita. Consume la API key del cliente.' }
]

// Ayuda contextual por módulo: qué es, cómo se usa (pasos) y un tip. Clave = id del registry.
export const moduleHelp = {
  torre: { title: 'Torre de Control', what: 'Tu panel de mando: los KPIs GEO del periodo y "qué cambió esta semana" (riesgos y qué hacer).',
    how: ['Lee los KPIs de un vistazo: verde/ámbar/rojo según objetivo.', 'Revisa "Qué ocurre / En riesgo / Qué hacer" para priorizar el día.', 'Cada dato lleva su estado (real / cualitativo / pendiente): no te fíes de lo pendiente como si fuera real.'],
    tip: 'Empieza siempre aquí. Si algo está en rojo, sáltalo a Riesgo & Alertas o al Ciclo GEO.' },
  ciclo: { title: 'Ciclo GEO', what: 'El bucle que convierte un hallazgo en resultado medible: Detecta → Diagnostica → Propone → Aprueba → Ejecuta → Re-mide.',
    how: ['Avanza paso a paso el caso activo.', 'En "Propone" se crea una tarjeta persistida en la Action Queue.', 'En "Re-mide" se consulta el LLM real para ver si la marca ya aparece (requiere API key en Conexiones).'],
    tip: 'El salto del marcador es ilustrativo del mecanismo; la métrica real la da la re-medición.' },
  visibilidad: { title: 'Visibilidad IA / GEO Twin', what: 'Cuánto aparece la marca por motor de IA y cómo la "ve" cada uno.',
    how: ['Compara la visibilidad entre ChatGPT, Perplexity, Gemini, AIO…', 'Los motores con captura pendiente aparecen marcados.'],
    tip: 'Baja visibilidad en un motor concreto suele ser un problema de contenido o de autoridad para ese ecosistema.' },
  'brand-link': { title: 'Brand vs Link Presence', what: 'Contraste entre menciones de marca y enlaces/citas a dominio propio.',
    how: ['Mira dónde te mencionan mucho pero te enlazan poco.'], tip: 'Mucha mención y poca cita = trabajar autoridad y contenido citable.' },
  prompts: { title: 'Prompts & Tracking', what: 'El banco de prompts que la herramienta vigila, con volumen, criticidad y si la marca está presente.',
    how: ['Prioriza por criticidad y volumen.', 'Edita qué prompts se monitorizan en Parametrización → Prompts monitorizados.'],
    tip: 'Un prompt crítico con presencia "ausente" es un Content Gap accionable.' },
  narrativas: { title: 'Narrativas & Claims', what: 'Las capas narrativas de la marca y el estado de validación de cada claim.',
    how: ['Revisa qué claims están aprobados / en revisión / pendientes antes de publicarlos.'], tip: 'En temas sensibles (salud, moderación) valida el claim antes de usarlo en contenido.' },
  autoridad: { title: 'Autoridad / ORM', what: 'Autoridad de los dominios de la marca (Domain Rating, backlinks…).', how: ['Compara la autoridad de tus dominios frente a la competencia.'], tip: 'La autoridad alimenta la capacidad de ser citado por la IA.' },
  'data-ia': { title: 'Data Resultados IA', what: 'El detalle de menciones y citas por marca que alimenta la Torre.', how: ['Úsalo para auditar de dónde salen los KPIs.'], tip: 'Si un KPI sorprende, valida aquí el dato bruto.' },
  'trafico-ia': { title: 'Tráfico IA (GA4)', what: 'Qué páginas reciben tráfico desde cada motor de IA.', how: ['Cruza motor × marca × landing.'], tip: 'Pendiente de volcado real de GA4 hasta que conecte el pipeline.' },
  competidores: { title: 'Competidores', what: 'Comparativa de visibilidad, citas y autoridad frente a la competencia.', how: ['Identifica quién te gana en citas aunque tengas más menciones.'], tip: 'El que más cita, no el que más menciona, controla la narrativa.' },
  horeca: { title: 'Local / HORECA', what: 'Señales locales (GBP, reviews) que influyen en la recomendación por IA.',
    how: ['Revisa oportunidades por POI (ficha, fotos, reviews).'], tip: 'Fichas completas y reviews respondidas mejoran la recomendación en "Ask Maps".' },
  'ai-overview': { title: 'AI Overview / SERP', what: 'Análisis del bloque AI Overview de Google y el ranking orgánico para una keyword.',
    how: ['Comprueba si el AIO está presente y si cita tu marca.'], tip: 'AIO presente que no te cita = oportunidad prioritaria.' },
  fuentes: { title: 'Fuentes & Datos', what: 'El cockpit del pipeline: backend, motor LLM, cobertura de fuentes e integridad del feed.',
    how: ['Comprueba que el backend está conectado y qué fuentes están en real/pendiente.', 'Si una sección del feed llega vacía, aquí lo verás avisado.'], tip: 'Antes de fiarte de un módulo, confirma aquí que su fuente está en "real".' },
  'action-queue': { title: 'Action Queue', what: 'La cola de trabajo real: acciones en pendiente / en curso / hecho, persistidas en disco.',
    how: ['Mueve las tarjetas entre columnas según avanzan.', 'Las tarjetas nuevas las crea el Ciclo GEO.'], tip: 'Mantén la cola al día: es la fuente de verdad de qué se está haciendo.' },
  riesgo: { title: 'Riesgo & Alertas', what: 'Los riesgos abiertos con severidad, owner y SLA.', how: ['Ataca primero lo crítico dentro de su SLA.', 'Convierte una alerta en acción vía el Ciclo GEO.'], tip: 'Un error factual sin corregir se propaga entre motores: prioriza.' },
  agentes: { title: 'Agentes & Automatización', what: 'Los agentes que monitorizan, mapean, publican y validan sobre la capa MCP.', how: ['Revisa el estado y última ejecución de cada agente.'], tip: 'El agente "Editor GEO" publica con aprobación: revisa antes de que ejecute.' },
  gobierno: { title: 'Gobierno & Roles', what: 'La matriz de quién ve qué (role-gating real).', how: ['Consulta qué módulos ve cada rol.', 'Para editarlo, botón "Editar roles y accesos" → Parametrización.'], tip: 'Da a cada rol solo lo que necesita: menos ruido, más seguridad.' },
  formacion: { title: 'Formación', what: 'La Academia GEO-OS: rutas por rol para dominar la herramienta.', how: ['Sigue la ruta de tu rol.'], tip: 'Empieza por el onboarding de la Torre y ve sumando módulos.' },
  reporting: { title: 'Reporting', what: 'La cadencia de informes, owners y export white-label.', how: ['Consulta qué informe toca y quién lo firma.'], tip: 'El informe mensual white-label sale con la marca del cliente.' },
  parametrizacion: { title: 'Parametrización', what: 'Configura la herramienta sin tocar ficheros: identidad, marcas, roles, KPI targets, prompts y conexiones.',
    how: ['Cambia lo que necesites por pestañas y pulsa "Guardar cambios".', 'En Conexiones metes la API key del LLM (nunca se muestra) y el data_source.'], tip: 'Solo roles con acceso total ven este panel, porque toca credenciales.' },
  costes: { title: 'Costes & Uso', what: 'El control de gasto por cliente: consumo por proveedor/modelo vs presupuesto.',
    how: ['Fija un presupuesto mensual y el modo (avisar o bloquear).', 'Registra el uso externo de proveedores de datos.'], tip: 'Modo "bloquear" corta la re-medición al agotar el presupuesto: útil para no llevarte sorpresas.' },
  'alta-cliente': { title: 'Alta de Cliente', what: 'Da de alta un cliente nuevo (config + feed inicial) sin tocar el core.', how: ['Sigue el asistente por pasos.'], tip: 'El core no cambia entre clientes: solo su config y su feed.' }
}

// Checklist "Tus primeros pasos" por rol. Cada tarea enlaza a un módulo que el usuario debe abrir.
const stepsCommon = [
  { id: 'torre', label: 'Revisa tu Torre de Control', hint: 'Lee tus KPIs y "qué cambió esta semana".', module: 'torre' },
  { id: 'help', label: 'Abre la ayuda contextual (botón ?)', hint: 'En cualquier módulo, el botón ? explica qué es y cómo se usa.', module: null }
]
export const onboarding = {
  admin: {
    title: 'Primeros pasos · Administrador',
    steps: [
      ...stepsCommon,
      { id: 'param', label: 'Configura la identidad en Parametrización', hint: 'Nombre, colores, white-label.', module: 'parametrizacion' },
      { id: 'conex', label: 'Conecta la API key del LLM', hint: 'Parametrización → Conexiones. Activa la re-medición real.', module: 'parametrizacion' },
      { id: 'costes', label: 'Fija el presupuesto en Costes & Uso', hint: 'Controla el gasto por cliente.', module: 'costes' },
      { id: 'ciclo', label: 'Corre un Ciclo GEO completo', hint: 'Detecta → Re-mide.', module: 'ciclo' }
    ]
  },
  squad: {
    title: 'Primeros pasos · Squad GEO',
    steps: [
      ...stepsCommon,
      { id: 'riesgo', label: 'Prioriza en Riesgo & Alertas', hint: 'Ataca lo crítico dentro de SLA.', module: 'riesgo' },
      { id: 'ciclo', label: 'Corre un Ciclo GEO', hint: 'Convierte un hallazgo en acción medible.', module: 'ciclo' },
      { id: 'aq', label: 'Mueve una acción en la Action Queue', hint: 'Pendiente → En curso → Hecho.', module: 'action-queue' },
      { id: 'prompts', label: 'Revisa el banco de Prompts', hint: 'Detecta content gaps críticos.', module: 'prompts' }
    ]
  },
  marcas: {
    title: 'Primeros pasos · Operador Marcas',
    steps: [
      ...stepsCommon,
      { id: 'vis', label: 'Revisa tu Visibilidad IA', hint: 'Cómo te ve cada motor.', module: 'visibilidad' },
      { id: 'brand', label: 'Mira Brand vs Link', hint: 'Menciones vs citas propias.', module: 'brand-link' },
      { id: 'narr', label: 'Valida claims en Narrativas', hint: 'Antes de publicar contenido.', module: 'narrativas' }
    ]
  },
  horeca: {
    title: 'Primeros pasos · Operador Hostelería',
    steps: [
      ...stepsCommon,
      { id: 'horeca', label: 'Revisa oportunidades en Local / HORECA', hint: 'Fichas, fotos y reviews por POI.', module: 'horeca' },
      { id: 'prompts', label: 'Mira los prompts de barra/grifo', hint: 'Dónde te recomienda (o no) la IA.', module: 'prompts' }
    ]
  }
}
export function onboardingFor(role) {
  return onboarding[role?.id] || { title: 'Primeros pasos', steps: onboarding.squad.steps }
}
