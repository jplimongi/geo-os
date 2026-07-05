<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useClient } from '../stores/client'

const client = useClient()
const router = useRouter()
const user = ref(''), pass = ref(''), err = ref('')

function submit() {
  const role = client.login(user.value, pass.value)
  if (role) router.push({ name: role.landing || 'torre' })
  else err.value = 'Credenciales no válidas'
}
</script>
<template>
  <div class="login">
    <form class="card login__box" @submit.prevent="submit">
      <div class="login__brand">
        <span class="dot"></span>
        <div>
          <strong>GEO-OS</strong>
          <div class="muted" style="font-size:12px">{{ client.config?.brand?.name }}</div>
        </div>
      </div>
      <label>Usuario<input v-model="user" autocomplete="username" /></label>
      <label>Contraseña<input v-model="pass" type="password" autocomplete="current-password" /></label>
      <button class="btn" type="submit">Entrar</button>
      <p v-if="err" style="color:var(--warn);font-size:13px;margin:4px 0 0">{{ err }}</p>
      <p class="muted" style="font-size:11px;margin-top:10px">
        Demo Mahou · admin / rtcupper2026* · marcasuser / msmmarcas2026*
      </p>
    </form>
  </div>
</template>
<style scoped>
.login{min-height:100vh;display:flex;align-items:center;justify-content:center;
  background:linear-gradient(135deg,var(--brand-primary) 0%,#7a0010 100%)}
.login__box{width:340px;display:flex;flex-direction:column;gap:12px}
.login__brand{display:flex;align-items:center;gap:10px;margin-bottom:6px}
.dot{width:26px;height:26px;border-radius:7px;background:var(--brand-primary)}
label{display:flex;flex-direction:column;font-size:12px;color:var(--muted);gap:4px}
input{padding:9px 10px;border:1px solid var(--line);border-radius:8px;font-size:14px}
</style>
