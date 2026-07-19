// Academia GEO-OS — Fase 2. Rutas de aprendizaje por rol: lecciones (micro, con tarea
// guiada en la propia herramienta) + examen de certificación. Contenido de producto (ES),
// ampliable y migrable a config por cliente. Aprobado del examen: >= 70%.

export const PASS = 0.7

// Cada lección: { id, title, mins, summary, points[], task:{label, module} }
// Cada ruta: { id, title, audience, lessons[], quiz:[{q, options[], answer(index)}] }
export const paths = [
  {
    id: 'fundamentos', title: 'Fundamentos GEO', audience: 'Todos los roles', icon: '🎓',
    lessons: [
      { id: 'que-es', title: '¿Qué es GEO y por qué importa?', mins: 4,
        summary: 'GEO (Generative Engine Optimization) es optimizar cómo la marca aparece en las respuestas de la IA (ChatGPT, Perplexity, Gemini, Google AI Overviews), no solo en el buscador clásico.',
        points: ['Mencionar ≠ citar: que te nombren no es lo mismo que citar tu web.', 'La IA responde; si no apareces ahí, dejas de existir para el usuario.', 'El objetivo es visibilidad + citas + narrativa correcta.'],
        task: { label: 'Abre la Torre y localiza AI Visibility y Citation Share', module: 'torre' } },
      { id: 'torre', title: 'Leer la Torre de Control', mins: 3,
        summary: 'La Torre es tu panel de mando: KPIs GEO del periodo y "qué cambió esta semana" (riesgos y qué hacer).',
        points: ['Lee los KPIs de un vistazo por color (verde/ámbar/rojo).', 'Prioriza el día con "Qué ocurre / En riesgo / Qué hacer".', 'Empieza siempre aquí.'],
        task: { label: 'Revisa "Qué cambió esta semana" en la Torre', module: 'torre' } },
      { id: 'ciclo', title: 'El Ciclo GEO (Detecta → Re-mide)', mins: 4,
        summary: 'El bucle que convierte un hallazgo en resultado medible: Detecta, Diagnostica, Propone, Aprueba, Ejecuta, Re-mide.',
        points: ['"Propone" crea una tarjeta en la Action Queue.', '"Re-mide" consulta el LLM real para ver si ya apareces.', 'Cierra el círculo: del problema al resultado.'],
        task: { label: 'Avanza un paso del Ciclo GEO', module: 'ciclo' } },
      { id: 'dato', title: 'La regla de oro del dato', mins: 2,
        summary: 'Cada dato declara su estado: real / cualitativo / pendiente. Nada se inventa.',
        points: ['No trates un "pendiente" como si fuera "real".', 'El badge de estado está en cada vista.', 'Ante la duda, verifica en Fuentes & Datos.'],
        task: { label: 'Comprueba el estado de las fuentes en Fuentes & Datos', module: 'fuentes' } }
    ],
    quiz: [
      { q: 'GEO consiste en…', options: ['Posicionar solo en Google clásico', 'Optimizar la presencia de la marca en las respuestas de la IA', 'Comprar anuncios en redes'], answer: 1 },
      { q: 'Que la IA te mencione…', options: ['Es lo mismo que citarte', 'No garantiza que cite tu web (autoridad)', 'No importa'], answer: 1 },
      { q: 'En el Ciclo GEO, "Re-mide"…', options: ['Consulta el LLM real para ver si apareces', 'Borra las acciones', 'Cambia el idioma'], answer: 0 },
      { q: 'Un dato marcado "pendiente"…', options: ['Es un dato real capturado', 'Está pendiente de volcado: no te fíes como si fuera real', 'Es un error del sistema'], answer: 1 },
      { q: '¿Por dónde conviene empezar el día?', options: ['Por la Action Queue', 'Por la Torre de Control', 'Por Parametrización'], answer: 1 }
    ]
  },
  {
    id: 'admin', title: 'Administración de la plataforma', audience: 'Administrador', icon: '🎛',
    lessons: [
      { id: 'param', title: 'Parametrizar sin tocar ficheros', mins: 4,
        summary: 'Desde Parametrización configuras identidad, marcas, competidores, roles, KPI targets y prompts. Se guarda y aplica al instante.',
        points: ['Edita por pestañas y pulsa "Guardar cambios".', 'El tema (colores, título) se reaplica sin recargar.', 'Solo roles con acceso total ven este panel.'],
        task: { label: 'Cambia un KPI target y guárdalo', module: 'parametrizacion' } },
      { id: 'conex', title: 'Conexiones: API key del LLM y data_source', mins: 4,
        summary: 'La API key del motor de re-medición se guarda cifrada en el servidor y nunca se muestra. También fijas el puntero al dataset del cliente.',
        points: ['La key habilita la re-medición real del Ciclo GEO.', 'Nunca viaja al navegador: solo ves "configurada/sin configurar".', 'Las credenciales de proveedores de datos las suele llevar el pipeline.'],
        task: { label: 'Revisa el estado de Conexiones', module: 'parametrizacion' } },
      { id: 'costes', title: 'Controlar el gasto', mins: 3,
        summary: 'En Costes & Uso fijas un presupuesto mensual por cliente y el modo (avisar o bloquear).',
        points: ['Modo "bloquear" corta la re-medición al agotar el presupuesto.', 'Cada re-medición registra tokens y coste reales.', 'Registra también el uso externo de proveedores de datos.'],
        task: { label: 'Fija un presupuesto en Costes & Uso', module: 'costes' } },
      { id: 'gob', title: 'Gobierno y roles', mins: 3,
        summary: 'El role-gating define quién ve qué. Cada rol ve solo sus módulos.',
        points: ['Da a cada rol lo mínimo que necesita.', 'Edita roles/usuarios/accesos desde Parametrización.', 'Las contraseñas se guardan hasheadas, nunca en claro.'],
        task: { label: 'Consulta la matriz en Gobierno & Roles', module: 'gobierno' } }
    ],
    quiz: [
      { q: 'La API key del LLM…', options: ['Se muestra en la interfaz', 'Se guarda cifrada en el servidor y nunca se muestra', 'Va en el config.json público'], answer: 1 },
      { q: 'El modo "bloquear" del presupuesto…', options: ['Corta la re-medición al agotar el límite', 'Borra el historial de coste', 'Sube el límite automáticamente'], answer: 0 },
      { q: 'El role-gating sirve para…', options: ['Cambiar los colores', 'Definir qué módulos ve cada rol', 'Acelerar el backend'], answer: 1 },
      { q: 'Al parametrizar, los cambios…', options: ['Requieren reiniciar el servidor', 'Se guardan y aplican al instante', 'Solo los ve el pipeline'], answer: 1 },
      { q: 'Las contraseñas de los roles…', options: ['Se guardan en claro en el config', 'Se guardan hasheadas server-side', 'No se guardan'], answer: 1 }
    ]
  },
  {
    id: 'squad', title: 'Operación del Squad GEO', audience: 'Squad GEO', icon: '⚙',
    lessons: [
      { id: 'riesgo', title: 'Protocolo Riesgo → Acción', mins: 4,
        summary: 'Los riesgos tienen severidad, owner y SLA. Ataca lo crítico dentro de su plazo y conviértelo en acción.',
        points: ['Prioriza crítico > alto > medio.', 'Un error factual sin corregir se propaga entre motores.', 'Desde una alerta, abre el Ciclo GEO.'],
        task: { label: 'Revisa Riesgo & Alertas y su SLA', module: 'riesgo' } },
      { id: 'ciclo', title: 'Correr un Ciclo GEO', mins: 4,
        summary: 'Avanza el caso paso a paso; en "Propone" nace una acción persistida; en "Re-mide" compruebas el resultado real.',
        points: ['El salto del marcador es ilustrativo; la métrica real la da la re-medición.', 'La re-medición consume la API key del cliente.', 'Deja constancia en la bitácora.'],
        task: { label: 'Corre el Ciclo GEO del caso activo', module: 'ciclo' } },
      { id: 'aq', title: 'Gestionar la Action Queue', mins: 3,
        summary: 'La cola persistente (pendiente / en curso / hecho) es la fuente de verdad de qué se está haciendo.',
        points: ['Mueve las tarjetas según avanzan.', 'Las nuevas las crea el Ciclo GEO.', 'Mantén la cola al día.'],
        task: { label: 'Mueve una acción de columna', module: 'action-queue' } }
    ],
    quiz: [
      { q: 'Ante varios riesgos, atacas primero…', options: ['El más antiguo', 'El crítico dentro de su SLA', 'El de menor impacto'], answer: 1 },
      { q: 'El salto del marcador del Ciclo GEO…', options: ['Es la métrica real capturada', 'Es ilustrativo; la real la da la re-medición', 'No significa nada'], answer: 1 },
      { q: 'La Action Queue es…', options: ['Un chat', 'La fuente de verdad de qué se está haciendo', 'Un informe PDF'], answer: 1 },
      { q: 'Las tarjetas nuevas de la Action Queue las crea…', options: ['El Ciclo GEO', 'El pipeline de datos', 'El administrador a mano'], answer: 0 }
    ]
  },
  {
    id: 'marcas', title: 'Operación de Marcas', audience: 'Operador Marcas', icon: '⚖',
    lessons: [
      { id: 'vis', title: 'Visibilidad IA por motor', mins: 3,
        summary: 'Cuánto aparece la marca en cada motor de IA y cómo la "ve" cada uno (GEO Twin).',
        points: ['Baja visibilidad en un motor suele ser contenido o autoridad.', 'Algunos motores requieren captura autenticada.', 'Compara por marca del grupo.'],
        task: { label: 'Revisa tu Visibilidad IA / GEO Twin', module: 'visibilidad' } },
      { id: 'brand', title: 'Brand vs Link', mins: 3,
        summary: 'Contraste entre menciones de marca y enlaces/citas a dominio propio.',
        points: ['Mucha mención y poca cita = trabajar autoridad y contenido citable.', 'El que más cita controla la narrativa.', 'Cruza con Competidores.'],
        task: { label: 'Analiza Brand vs Link Presence', module: 'brand-link' } },
      { id: 'narr', title: 'Narrativas y validación de claims', mins: 3,
        summary: 'Las capas narrativas de la marca y el estado de validación de cada claim.',
        points: ['Valida el claim antes de publicarlo.', 'En temas sensibles (salud, moderación) extrema el cuidado.', 'Aprobado / en revisión / pendiente.'],
        task: { label: 'Revisa el estado de claims en Narrativas', module: 'narrativas' } }
    ],
    quiz: [
      { q: 'Mucha mención y poca cita indica…', options: ['Que todo va bien', 'Que hay que trabajar autoridad y contenido citable', 'Que sobra presupuesto'], answer: 1 },
      { q: 'Quién controla la narrativa es…', options: ['El que más menciones tiene', 'El que más citas obtiene', 'El más antiguo'], answer: 1 },
      { q: 'Antes de publicar un claim sensible…', options: ['Se publica directo', 'Se valida su estado en Narrativas', 'Se ignora'], answer: 1 }
    ]
  },
  {
    id: 'horeca', title: 'Operación Hostelería', audience: 'Operador Hostelería', icon: '📍',
    lessons: [
      { id: 'horeca', title: 'Señales locales para la IA', mins: 3,
        summary: 'Fichas (GBP), fotos y reviews influyen en cómo la IA recomienda locales ("Ask Maps").',
        points: ['Fichas completas y reviews respondidas mejoran la recomendación.', 'Revisa oportunidades por POI.', 'Añade atributos de producto (cerveza de barril).'],
        task: { label: 'Revisa oportunidades en Local / HORECA', module: 'horeca' } },
      { id: 'prompts', title: 'Prompts de barra y grifo', mins: 3,
        summary: 'Los prompts tipo "dónde tomar una buena caña" muestran si la IA te recomienda o no.',
        points: ['Prioriza prompts de alta criticidad.', 'Presencia "ausente" en un prompt clave = oportunidad.', 'Cruza con las señales locales.'],
        task: { label: 'Mira los prompts de hostelería en Prompts & Tracking', module: 'prompts' } }
    ],
    quiz: [
      { q: 'Lo que mejora la recomendación local por IA es…', options: ['Fichas completas y reviews respondidas', 'Cambiar el logo', 'Subir el presupuesto'], answer: 0 },
      { q: 'Un prompt clave con presencia "ausente" es…', options: ['Un error', 'Una oportunidad a trabajar', 'Irrelevante'], answer: 1 }
    ]
  }
]

// Rutas visibles según rol: Fundamentos siempre; la ruta del rol; el admin ve todas.
export function pathsForRole(role) {
  if (!role) return paths.filter(p => p.id === 'fundamentos')
  if (role.sees === 'all' || role.platform_admin) return paths
  const map = { marcas: 'marcas', horeca: 'horeca', squad: 'squad', admin: 'admin' }
  const own = map[role.id]
  return paths.filter(p => p.id === 'fundamentos' || p.id === own)
}
