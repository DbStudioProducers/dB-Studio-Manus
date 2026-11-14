#!/usr/bin/env bash
set -euo pipefail

command -v adb >/dev/null || { echo "adb não está instalado no runner" >&2; exit 1; }
command -v adb
adb start-server >/dev/null

if [[ -z "${ANDROID_SERIAL:-}" ]]; then
  echo "DBSTUDIO_ANDROID_SERIAL não configurado; defina o serial do Android conectado ao runner." >&2
  exit 1
fi

state=$(adb -s "$ANDROID_SERIAL" get-state 2>/dev/null || true)
[[ "$state" == "device" ]] || {
  echo "Android não está conectado/autorizado: $ANDROID_SERIAL (state=$state)" >&2
  adb devices -l || true
  exit 1
}

adb -s "$ANDROID_SERIAL" shell getprop ro.build.version.sdk
adb -s "$ANDROID_SERIAL" shell getprop ro.product.model
echo "Android Oboe preflight: ok"
