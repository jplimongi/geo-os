#!/bin/bash
# GEO-OS · Lanzador de doble clic (sin terminal, sin comandos).
# Arranca backend + frontend y abre la app en el navegador.
# Un usuario funcional solo tiene que hacer DOBLE CLIC en este archivo.

cd "$(dirname "$0")" || exit 1
clear
echo "══════════════════════════════════════════"
echo "     GEO-OS · arrancando la plataforma"
echo "══════════════════════════════════════════"
echo ""

# 0. Node instalado?
if ! command -v npm >/dev/null 2>&1; then
  echo "✗ No encuentro Node.js. Instálalo una vez desde https://nodejs.org (versión LTS)."
  echo "  Luego vuelve a hacer doble clic en este archivo."
  read -p "Pulsa Enter para cerrar…"; exit 1
fi

# 1. Dependencias (solo la primera vez)
if [ ! -d node_modules ]; then
  echo "→ Primera vez: instalando dependencias (1-2 min)…"
  npm install || { echo "✗ Falló la instalación."; read -p "Enter para cerrar…"; exit 1; }
fi

# 2. Arranca backend (:3001) y frontend (:5173)
echo "→ Arrancando servicios…"
npm run server > /tmp/geo-os-server.log 2>&1 &
SRV=$!
npm run dev > /tmp/geo-os-dev.log 2>&1 &
DEV=$!

# 3. Espera a que el frontend responda
echo "→ Esperando a que la app esté lista…"
ready=0
for i in $(seq 1 30); do
  if curl -s http://localhost:5173 >/dev/null 2>&1; then ready=1; break; fi
  sleep 1
done

# 3b. Autocorrección del fallo típico de dependencias (rollup entre macOS/Linux)
if [ "$ready" = "0" ] && grep -qi "rollup" /tmp/geo-os-dev.log 2>/dev/null; then
  echo "→ Ajustando dependencias (una vez)…"
  kill $DEV 2>/dev/null
  rm -rf node_modules package-lock.json && npm install
  npm run dev > /tmp/geo-os-dev.log 2>&1 &
  DEV=$!
  for i in $(seq 1 30); do curl -s http://localhost:5173 >/dev/null 2>&1 && { ready=1; break; }; sleep 1; done
fi

# 4. Abre el navegador
open http://localhost:5173

echo ""
echo "══════════════════════════════════════════"
if [ "$ready" = "1" ]; then
  echo "  ✓ GEO-OS abierto:  http://localhost:5173"
else
  echo "  ⚠ Tardó en arrancar. Abre a mano: http://localhost:5173"
  echo "    (log: /tmp/geo-os-dev.log)"
fi
echo "  Login admin:  admin / rtcupper2026*"
echo "══════════════════════════════════════════"
echo ""
echo "  ⚠ DEJA ESTA VENTANA ABIERTA mientras uses la app."
echo "     Para cerrar la plataforma: cierra esta ventana."
echo ""

# 5. Limpieza al cerrar
trap "echo 'Cerrando GEO-OS…'; kill $SRV $DEV 2>/dev/null; exit 0" INT TERM
wait
