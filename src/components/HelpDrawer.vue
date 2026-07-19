<script setup>
// Panel de ayuda contextual: explica el módulo actual (qué/cómo/tips) + glosario buscable.
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { moduleHelp, glossary } from '../content/help'

defineProps({ open: Boolean })
const emit = defineEmits(['close'])
const route = useRoute()
const q = ref('')
const help = computed(() => moduleHelp[route.meta?.moduleId] || null)
const terms = computed(() => {
  const s = q.value.trim().toLowerCase()
  return s ? glossary.filter(g => (g.term + ' ' + g.def).toLowerCase().includes(s)) : glossary
})
</script>

<template>
  <transition name="drw">
    <div v-if="open" class="ov" @click.self="emit('close')">
      <aside class="drw">
        <header class="drw__h">
          <strong>Ayuda</strong>
          <button class="x" @click="emit('close')">✕</button>
        </header>
        <div class="drw__body">
          <!-- Ayuda del módulo actual -->
          <div v-if="help" class="blk">
            <div class="eyebrow">Este módulo</div>
            <h3>{{ help.title }}</h3>
            <p class="what">{{ help.what }}</p>
            <div class="sub">Cómo se usa</div>
            <ol><li v-for="(s,i) in help.how" :key="i">{{ s }}</li></ol>
            <div v-if="help.tip" class="tip">💡 {{ help.tip }}</div>
          </div>
          <div v-else class="blk muted">Abre un módulo para ver su ayuda contextual.</div>

          <!-- Glosario -->
          <div class="blk">
            <div class="eyebrow">Glosario GEO / LLMO</div>
            <input v-model="q" class="search" placeholder="Buscar término…" />
            <dl>
              <template v-for="g in terms" :key="g.term">
                <dt>{{ g.term }}</dt><dd>{{ g.def }}</dd>
              </template>
              <dd v-if="!terms.length" class="muted">Sin resultados.</dd>
            </dl>
          </div>

          <p class="foot muted">¿Empiezas? Sigue el checklist «Tus primeros pasos» en la Torre de Control.</p>
        </div>
      </aside>
    </div>
  </transition>
</template>

<style scoped>
.ov{position:fixed;inset:0;background:rgba(20,24,28,.35);z-index:50;display:flex;justify-content:flex-end}
.drw{width:400px;max-width:92vw;height:100vh;background:var(--brand-surface);box-shadow:-8px 0 30px rgba(0,0,0,.15);display:flex;flex-direction:column}
.drw__h{display:flex;justify-content:space-between;align-items:center;padding:16px 18px;border-bottom:1px solid var(--line)}
.drw__h strong{font-family:'Barlow';font-size:16px}
.x{border:none;background:transparent;font-size:15px;cursor:pointer;color:var(--muted)}
.drw__body{padding:18px;overflow:auto}
.blk{margin-bottom:22px}
.eyebrow{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);font-weight:700;margin-bottom:6px}
h3{font-family:'Barlow';font-size:16px;margin:0 0 6px}
.what{font-size:14px;color:var(--brand-ink);margin:0 0 12px}
.sub{font-size:12px;font-weight:700;color:var(--muted);margin-bottom:6px}
ol{margin:0 0 12px;padding-left:18px;font-size:13px}
ol li{margin-bottom:5px}
.tip{background:#FCF3DA;color:#9a7400;border-radius:8px;padding:9px 11px;font-size:13px}
.search{width:100%;padding:8px 10px;border:1px solid var(--line);border-radius:8px;font-size:13px;margin-bottom:10px}
dl{margin:0}
dt{font-weight:700;font-size:13px;margin-top:8px}
dd{margin:2px 0 0;font-size:12.5px;color:var(--muted);line-height:1.45}
.foot{font-size:12px;margin-top:8px;border-top:1px solid var(--line);padding-top:12px}
.drw-enter-active,.drw-leave-active{transition:opacity .2s}
.drw-enter-from,.drw-leave-to{opacity:0}
</style>
