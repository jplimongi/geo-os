<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useClient } from './stores/client'

const client = useClient()
const router = useRouter()
// Carga la config y, si no hay sesión, aterriza en login (evita la carrera del guard
// que dejaba entrar a un módulo vacío antes de terminar la carga async).
onMounted(async () => {
  await client.load()
  if (!client.isAuthed && router.currentRoute.value.name !== 'login') router.replace({ name: 'login' })
})
</script>

<template>
  <div v-if="client.loading" class="boot">Cargando GEO-OS…</div>
  <div v-else-if="client.error" class="boot boot--err">
    Error cargando el cliente: {{ client.error }}
  </div>
  <router-view v-else />
</template>

<style scoped>
.boot { display:flex; align-items:center; justify-content:center; height:100vh;
  font-family:'Barlow',sans-serif; color:#5B6B82; letter-spacing:.02em; }
.boot--err { color:#D7263D; }
</style>
