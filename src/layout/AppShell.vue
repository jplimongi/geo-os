<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useClient } from '../stores/client'
import { registry } from '../modules/registry'
import HelpDrawer from '../components/HelpDrawer.vue'
import CommentsLayer from '../components/CommentsLayer.vue'

const client = useClient()
const router = useRouter()
const help = ref(false)

const modules = computed(() => client.visibleModules(registry))
const groups = computed(() => {
  const g = {}
  modules.value.forEach(m => { (g[m.group] ||= []).push(m) })
  return g
})
function logout() { client.logout(); router.push({ name: 'login' }) }
</script>
<template>
  <div class="shell">
    <aside class="side">
      <div class="side__brand">
        <span class="dot"></span>
        <div>
          <strong>GEO-OS</strong>
          <div class="wl muted">{{ client.config?.brand?.white_label || 'white-label' }} · powered by {{ client.config?.brand?.powered_by || 'cupperlab' }}</div>
        </div>
      </div>
      <nav>
        <template v-for="(items, grp) in groups" :key="grp">
          <div class="side__grp">{{ grp }}</div>
          <router-link v-for="m in items" :key="m.id" :to="m.path" class="side__link" active-class="is-active">
            <span class="ic">{{ m.icon }}</span>{{ m.title }}
          </router-link>
        </template>
      </nav>
    </aside>

    <div class="main">
      <header class="top">
        <div>
          <strong>{{ client.config?.brand?.name }}</strong>
          <span class="muted"> · {{ client.feed?.period || '—' }}</span>
        </div>
        <div class="top__right">
          <button class="help-btn" @click="help = true" title="Ayuda y glosario">?</button>
          <span class="pill" style="background:#EEF1F6;color:#5B6B82">{{ client.role?.label }}</span>
          <button class="btn btn--ghost" @click="logout">Salir</button>
        </div>
      </header>
      <main class="content"><router-view /></main>
    </div>
    <HelpDrawer :open="help" @close="help = false" />
    <CommentsLayer />
  </div>
</template>
<style scoped>
.shell{display:grid;grid-template-columns:264px 1fr;min-height:100vh}
.side{background:var(--brand-ink);color:#fff;padding:18px 12px;position:sticky;top:0;height:100vh;overflow:auto}
.side__brand{display:flex;align-items:center;gap:10px;padding:6px 8px 16px}
.dot{width:26px;height:26px;border-radius:7px;background:var(--brand-primary)}
.wl{font-size:10px;color:#9aa4b2 !important}
.side__grp{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:#9aa4b2;margin:14px 10px 6px}
.side__link{display:flex;align-items:center;gap:9px;padding:8px 10px;border-radius:8px;color:#d6dae0;font-size:14px}
.side__link:hover{background:rgba(255,255,255,.06)}
.side__link.is-active{background:var(--brand-primary);color:#fff}
.ic{width:18px;text-align:center}
.main{display:flex;flex-direction:column;min-width:0}
.top{display:flex;justify-content:space-between;align-items:center;padding:14px 26px;background:var(--brand-surface);border-bottom:1px solid var(--line);position:sticky;top:0;z-index:5}
.top__right{display:flex;align-items:center;gap:12px}
.help-btn{width:28px;height:28px;border-radius:50%;border:1px solid var(--line);background:var(--brand-surface);color:var(--brand-primary);font-weight:800;cursor:pointer;font-size:14px}
.help-btn:hover{background:var(--brand-bg)}
.content{padding:26px;max-width:1200px}
</style>
