<script setup>
// ACADEMIA GEO-OS (Fase 2): rutas por rol con lecciones (tarea guiada) + examen de
// certificación. Progreso y certificación persistidos en localStorage por cliente+rol.
import { ref, reactive, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useClient } from '../stores/client'
import { pathsForRole, PASS } from '../content/academy'

const client = useClient()
const router = useRouter()
const myPaths = computed(() => pathsForRole(client.role))
const sel = ref(myPaths.value[0]?.id)
const path = computed(() => myPaths.value.find(p => p.id === sel.value) || myPaths.value[0])

const key = computed(() => `geoos:academy:${client.id}:${client.role?.id || 'x'}`)
function load() { try { return JSON.parse(localStorage.getItem(key.value) || '{}') } catch { return {} } }
const store = ref(load())
function save() { try { localStorage.setItem(key.value, JSON.stringify(store.value)) } catch {} }
function pdata(id) { return store.value[id] || { done: [], cert: null } }

const done = computed(() => pdata(path.value.id).done)
const cert = computed(() => pdata(path.value.id).cert)
const total = computed(() => path.value.lessons.length)
const pct = computed(() => total.value ? Math.round(done.value.length / total.value * 100) : 0)
const allDone = computed(() => done.value.length === total.value)
const open = ref(null)

function toggleLesson(id) {
  const d = pdata(path.value.id); const s = new Set(d.done)
  s.has(id) ? s.delete(id) : s.add(id)
  store.value = { ...store.value, [path.value.id]: { ...d, done: [...s] } }; save()
}
function goTask(t) { if (t?.module) router.push({ name: t.module }) }

// --- Examen ---
const examMode = ref(false)
const answers = reactive({})
const result = ref(null)
function startExam() { examMode.value = true; result.value = null; Object.keys(answers).forEach(k => delete answers[k]) }
function grade() {
  const q = path.value.quiz
  let ok = 0
  q.forEach((item, i) => { if (answers[i] === item.answer) ok++ })
  const score = ok / q.length
  result.value = { ok, n: q.length, score, pass: score >= PASS }
  if (result.value.pass) {
    const d = pdata(path.value.id)
    store.value = { ...store.value, [path.value.id]: { ...d, cert: { score: Math.round(score * 100), date: new Date().toISOString().slice(0, 10) } } }
    save()
  }
}
function closeExam() { examMode.value = false; result.value = null }
watch(sel, () => { examMode.value = false; result.value = null; open.value = null })
</script>

<template>
  <section>
    <h1 class="section-title">🎓 Academia GEO-OS</h1>
    <p class="muted" style="margin:6px 0 18px">Rutas de aprendizaje por rol. Aprende usando la herramienta y certifícate. Tu progreso se guarda solo.</p>

    <!-- Selector de rutas -->
    <div class="tabs">
      <button v-for="p in myPaths" :key="p.id" class="tab" :class="{ on: sel === p.id }" @click="sel = p.id">
        <span>{{ p.icon }} {{ p.title }}</span>
        <span v-if="pdata(p.id).cert" class="dot" title="Certificado">✓</span>
      </button>
    </div>

    <div class="card" v-if="path">
      <!-- Cabecera de ruta -->
      <div class="ph">
        <div>
          <h2>{{ path.icon }} {{ path.title }}</h2>
          <div class="muted" style="font-size:12px">Para: {{ path.audience }} · {{ total }} lecciones</div>
        </div>
        <div v-if="cert" class="badge">✓ GEO-OS Certified · {{ cert.score }}% · {{ cert.date }}</div>
      </div>
      <div class="track"><div class="fill" :style="{ width: pct + '%' }"></div></div>
      <div class="muted" style="font-size:12px;margin:6px 0 14px">{{ done.length }}/{{ total }} lecciones completadas</div>

      <!-- EXAMEN -->
      <template v-if="examMode">
        <h3 style="margin-bottom:10px">Examen de certificación · {{ path.title }}</h3>
        <div v-for="(item,i) in path.quiz" :key="i" class="q">
          <div class="q__t">{{ i + 1 }}. {{ item.q }}</div>
          <label v-for="(o,oi) in item.options" :key="oi" class="opt" :class="{ sel: answers[i]===oi }">
            <input type="radio" :name="'q'+i" :checked="answers[i]===oi" @change="answers[i]=oi" /> {{ o }}
          </label>
        </div>
        <div v-if="result" :class="['exam-res', result.pass ? 'ok':'ko']">
          {{ result.pass ? '✓ ¡Aprobado!' : '✗ No alcanzado' }} · {{ result.ok }}/{{ result.n }} ({{ Math.round(result.score*100) }}%).
          {{ result.pass ? 'Certificado emitido.' : 'Necesitas ' + Math.round(PASS*100) + '%. Repasa y reinténtalo.' }}
        </div>
        <div class="row">
          <button class="btn" v-if="!result" :disabled="Object.keys(answers).length < path.quiz.length" @click="grade">Corregir examen</button>
          <button class="btn" v-else-if="!result.pass" @click="startExam">Reintentar</button>
          <button class="btn btn--ghost" @click="closeExam">{{ result?.pass ? 'Cerrar' : 'Volver a las lecciones' }}</button>
        </div>
      </template>

      <!-- LECCIONES -->
      <template v-else>
        <div v-for="(l,i) in path.lessons" :key="l.id" class="lesson" :class="{ done: done.includes(l.id) }">
          <div class="lesson__h" @click="open = open===l.id ? null : l.id">
            <button class="chk" @click.stop="toggleLesson(l.id)">{{ done.includes(l.id) ? '✓' : '' }}</button>
            <div style="flex:1">
              <div class="lesson__t">{{ i + 1 }}. {{ l.title }}</div>
              <div class="muted" style="font-size:12px">⏱ {{ l.mins }} min</div>
            </div>
            <span class="chev">{{ open===l.id ? '▾' : '▸' }}</span>
          </div>
          <div v-if="open===l.id" class="lesson__body">
            <p class="summary">{{ l.summary }}</p>
            <ul><li v-for="(pt,pi) in l.points" :key="pi">{{ pt }}</li></ul>
            <div class="task">
              <div><strong>Hazlo en la herramienta:</strong> {{ l.task.label }}</div>
              <button class="mini" @click="goTask(l.task)">Ir al módulo →</button>
            </div>
            <button class="btn btn--ghost sm" @click="toggleLesson(l.id)">{{ done.includes(l.id) ? 'Marcar pendiente' : 'Marcar completada ✓' }}</button>
          </div>
        </div>

        <!-- Certificación -->
        <div class="certbox">
          <div v-if="cert" class="certbox__done">✓ Ruta certificada el {{ cert.date }} con {{ cert.score }}%. <button class="link" @click="startExam">Repetir examen</button></div>
          <template v-else>
            <div class="muted" style="font-size:13px;margin-bottom:8px">
              {{ allDone ? 'Has completado todas las lecciones. ¡Haz el examen para certificarte!' : 'Completa las ' + total + ' lecciones para desbloquear el examen.' }}
            </div>
            <button class="btn" :disabled="!allDone" @click="startExam">Hacer examen de certificación</button>
          </template>
        </div>
      </template>
    </div>
  </section>
</template>

<style scoped>
.tabs{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}
.tab{display:flex;align-items:center;gap:8px;padding:8px 14px;border:1px solid var(--line);border-radius:999px;background:var(--brand-surface);font-size:13px;color:var(--muted);cursor:pointer}
.tab.on{border-color:var(--brand-primary);color:var(--brand-primary);font-weight:600}
.dot{background:#1E9E6A;color:#fff;border-radius:50%;width:16px;height:16px;display:inline-flex;align-items:center;justify-content:center;font-size:10px}
.ph{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:10px}
h2{font-family:'Barlow';font-size:17px;margin:0}
.badge{background:#EAF6EF;color:#1E9E6A;border:1px solid #b8e6cd;border-radius:8px;padding:6px 10px;font-size:12px;font-weight:600;white-space:nowrap}
.track{height:6px;background:var(--brand-bg);border-radius:99px;overflow:hidden}
.fill{height:100%;background:var(--brand-primary);border-radius:99px;transition:width .4s}
.lesson{border:1px solid var(--line);border-radius:10px;margin-bottom:10px;overflow:hidden}
.lesson.done{border-color:#b8e6cd}
.lesson__h{display:flex;align-items:center;gap:10px;padding:12px 14px;cursor:pointer}
.chk{width:22px;height:22px;min-width:22px;border:1.5px solid var(--line);border-radius:6px;background:transparent;cursor:pointer;color:var(--brand-primary);font-weight:800;font-size:13px}
.lesson.done .chk{background:#1E9E6A;color:#fff;border-color:#1E9E6A}
.lesson__t{font-size:14px;font-weight:600}
.chev{color:var(--muted)}
.lesson__body{padding:0 14px 14px 46px}
.summary{font-size:14px;margin:0 0 8px}
.lesson__body ul{margin:0 0 12px;padding-left:16px;font-size:13px}
.lesson__body li{margin-bottom:4px}
.task{background:var(--brand-bg);border-radius:8px;padding:10px 12px;font-size:13px;display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:10px}
.mini{border:1px solid var(--brand-primary);background:transparent;color:var(--brand-primary);border-radius:6px;padding:5px 10px;font-size:12px;cursor:pointer;white-space:nowrap}
.sm{font-size:12px;padding:5px 10px}
.certbox{margin-top:16px;border-top:1px solid var(--line);padding-top:14px}
.certbox__done{background:#EAF6EF;color:#1E9E6A;border-radius:8px;padding:10px 12px;font-size:13px}
.link{border:none;background:transparent;color:inherit;text-decoration:underline;cursor:pointer;font-size:13px}
.q{margin-bottom:14px}
.q__t{font-size:14px;font-weight:600;margin-bottom:6px}
.opt{display:flex;align-items:center;gap:8px;padding:7px 10px;border:1px solid var(--line);border-radius:8px;margin-bottom:6px;font-size:13px;cursor:pointer}
.opt.sel{border-color:var(--brand-primary);background:var(--brand-bg)}
.exam-res{border-radius:8px;padding:10px 12px;font-size:13px;margin:8px 0}
.exam-res.ok{background:#EAF6EF;color:#1E9E6A}
.exam-res.ko{background:#FBE7EA;color:#D7263D}
.row{display:flex;gap:10px;margin-top:10px}
h3{font-family:'Barlow';font-size:15px}
</style>
