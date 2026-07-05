<script setup>
import { onMounted } from 'vue'
import { useClient } from './stores/client'

const client = useClient()
onMounted(() => client.load())
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
