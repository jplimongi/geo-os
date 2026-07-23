<script setup>
// CAPA DE COMENTARIOS (post-its clavados). Cualquier usuario logueado deja notas de mejora
// ancladas al módulo actual y a una posición (x,y en % del viewport). Autor o acceso total
// editan/borran; cualquiera resuelve/reabre y reposiciona (arrastrando). Persistido en backend.
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useClient } from '../stores/client'
import { api } from '../api'

const client = useClient()
const route = useRoute()
const moduleId = computed(() => route.meta?.moduleId || null)

const comments = ref([])   // notas del módulo actual (incl. borradores locales sin id)
const addMode = ref(false)
const showResolved = ref(false)
const fullAccess = computed(() => client.role?.sees === 'all')

const visible = computed(() => comments.value.filter(c => showResolved.value || c.status !== 'resolved'))
const openCount = computed(() => comments.value.filter(c => c.status === 'open').length)

function canEdit(c) { return c.author?.role === client.role?.id || fullAccess.value }
function clamp(v) { return Math.max(2, Math.min(98, v)) }

async function fetchComments() {
  if (!moduleId.value) { comments.value = []; return }
  try { comments.value = await api.getComments(client.id, moduleId.value) }
  catch { comments.value = [] }
}
onMounted(fetchComments)
watch(moduleId, () => { addMode.value = false; fetchComments() })

// Colocar una nota nueva: clic en la capa (en modo añadir) → borrador editable in situ.
function onLayerClick(e) {
  if (!addMode.value) return
  const x = clamp(e.clientX / window.innerWidth * 100)
  const y = clamp(e.clientY / window.innerHeight * 100)
  comments.value.unshift({
    id: null, module: moduleId.value, x, y, text: '',
    author: { role: client.role?.id, label: client.role?.label }, status: 'open',
    editing: true, _draft: true
  })
  addMode.value = false
}

async function save(c) {
  const t = (c.text || '').trim()
  if (!t) { remove(c, true); return }
  try {
    if (c._draft) {
      const saved = await api.createComment(client.id, { module: c.module, x: c.x, y: c.y, text: t })
      Object.assign(c, saved, { editing: false, _draft: false })
    } else {
      await api.updateComment(client.id, c.id, { text: t }); c.editing = false
    }
  } catch (e) { alert('No se pudo guardar: ' + e.message) }
}
function edit(c) { c._before = c.text; c.editing = true }
function cancel(c) { if (c._draft) remove(c, true); else { c.text = c._before; c.editing = false } }
function remove(c, silent) {
  const drop = () => { comments.value = comments.value.filter(x => x !== c) }
  if (c._draft || c.id == null) return drop()
  if (!silent && !confirm('¿Borrar este comentario?')) return
  api.deleteComment(client.id, c.id).then(drop).catch(e => alert('No se pudo borrar: ' + e.message))
}
async function toggleResolved(c) {
  const next = c.status === 'resolved' ? 'open' : 'resolved'
  try { const r = await api.updateComment(client.id, c.id, { status: next }); Object.assign(c, r) }
  catch (e) { alert('No se pudo actualizar: ' + e.message) }
}

// Arrastrar para reposicionar (pointer). No arrastra si está en edición.
let drag = null
function onDown(e, c) {
  if (c.editing) return
  e.preventDefault()
  drag = c
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp, { once: true })
}
function onMove(e) {
  if (!drag) return
  drag.x = clamp(e.clientX / window.innerWidth * 100)
  drag.y = clamp(e.clientY / window.innerHeight * 100)
}
function onUp() {
  window.removeEventListener('pointermove', onMove)
  if (drag && drag.id) api.updateComment(client.id, drag.id, { x: drag.x, y: drag.y }).catch(() => {})
  drag = null
}
</script>

<template>
  <!-- Overlay: sin eventos salvo en modo añadir; los post-its sí reciben eventos siempre -->
  <div class="clayer" :class="{ adding: addMode }" @click="onLayerClick">
    <div v-for="c in visible" :key="c.id || 'draft'" class="note" :class="{ resolved: c.status === 'resolved' }"
         :style="{ left: c.x + '%', top: c.y + '%' }" @click.stop>
      <div class="note__h" @pointerdown="onDown($event, c)">
        <span class="who">{{ c.author?.label || '—' }}</span>
        <span v-if="c.status === 'resolved'" class="ok">✓ resuelto</span>
      </div>
      <template v-if="c.editing">
        <textarea v-model="c.text" class="note__ta" rows="3" placeholder="Sugerencia de mejora…" autofocus></textarea>
        <div class="note__a">
          <button class="mini" @click="save(c)">Guardar</button>
          <button class="mini ghost" @click="cancel(c)">Cancelar</button>
        </div>
      </template>
      <template v-else>
        <div class="note__b">{{ c.text }}</div>
        <div class="note__a">
          <button class="mini ghost" @click="toggleResolved(c)">{{ c.status === 'resolved' ? 'Reabrir' : 'Resolver' }}</button>
          <button v-if="canEdit(c)" class="mini ghost" @click="edit(c)">Editar</button>
          <button v-if="canEdit(c)" class="mini ghost del" @click="remove(c)">Borrar</button>
        </div>
      </template>
    </div>

    <!-- Aviso en modo añadir -->
    <div v-if="addMode" class="hint">Haz clic donde quieras clavar la nota · <a @click.stop="addMode = false">cancelar</a></div>
  </div>

  <!-- Lanzador -->
  <div class="launcher">
    <label v-if="comments.length" class="tgl" @click.stop>
      <input type="checkbox" v-model="showResolved" /> resueltos
    </label>
    <button class="fab" :class="{ on: addMode }" @click="addMode = !addMode"
            :title="addMode ? 'Cancelar' : 'Añadir comentario de mejora'">
      <span>{{ addMode ? '✕' : '💬' }}</span>
      <span v-if="!addMode && openCount" class="badge">{{ openCount }}</span>
    </button>
  </div>
</template>

<style scoped>
.clayer{position:fixed;inset:0;pointer-events:none;z-index:40}
.clayer.adding{pointer-events:auto;cursor:crosshair;background:rgba(30,158,106,.05)}
.note{position:fixed;transform:translate(-50%,0);width:230px;background:#FFF8C8;border:1px solid #E6D98A;
  border-radius:10px;box-shadow:0 6px 20px rgba(0,0,0,.18);padding:8px 10px;pointer-events:auto;font-size:13px}
.note.resolved{background:#EEF3EE;border-color:#c9dcc9;opacity:.85}
.note__h{display:flex;justify-content:space-between;align-items:center;gap:8px;cursor:grab;margin-bottom:6px;
  border-bottom:1px dashed rgba(0,0,0,.12);padding-bottom:5px}
.note__h:active{cursor:grabbing}
.who{font-size:11px;font-weight:700;color:#7a6a1f}
.note.resolved .who{color:#3f6b4a}
.ok{font-size:10px;color:#1E9E6A;font-weight:700}
.note__b{white-space:pre-wrap;word-break:break-word;color:#3a3520;margin-bottom:6px}
.note__ta{width:100%;box-sizing:border-box;border:1px solid #E6D98A;border-radius:6px;background:#fffdf0;
  font:inherit;font-size:13px;padding:6px;resize:vertical}
.note__a{display:flex;gap:6px;flex-wrap:wrap;margin-top:4px}
.mini{border:1px solid #cbb968;background:#fffdf0;color:#6b5d16;border-radius:6px;padding:4px 9px;font-size:11px;cursor:pointer}
.mini.ghost{background:transparent}
.mini.del{color:#D7263D;border-color:#e7a6ae}
.hint{position:fixed;bottom:84px;left:50%;transform:translateX(-50%);background:var(--brand-ink,#1b2430);color:#fff;
  padding:8px 14px;border-radius:999px;font-size:13px;pointer-events:auto;box-shadow:0 4px 14px rgba(0,0,0,.2)}
.hint a{color:#8fd3b5;cursor:pointer;text-decoration:underline}
.launcher{position:fixed;right:22px;bottom:22px;z-index:50;display:flex;align-items:center;gap:10px}
.tgl{display:flex;align-items:center;gap:5px;font-size:12px;color:var(--muted,#5B6B82);background:var(--brand-surface,#fff);
  border:1px solid var(--line,#e4e8ee);border-radius:999px;padding:5px 10px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.08)}
.fab{position:relative;width:52px;height:52px;border-radius:50%;border:none;background:var(--brand-primary,#1E9E6A);
  color:#fff;font-size:22px;cursor:pointer;box-shadow:0 6px 18px rgba(0,0,0,.22)}
.fab.on{background:#D7263D}
.badge{position:absolute;top:-4px;right:-4px;background:#D7263D;color:#fff;font-size:11px;font-weight:700;
  min-width:20px;height:20px;border-radius:999px;display:flex;align-items:center;justify-content:center;padding:0 5px}
</style>
