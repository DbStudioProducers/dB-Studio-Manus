#!/usr/bin/env bash
set -euo pipefail

backend="${1:?backend obrigatório}"
command -v system_profiler >/dev/null
system_profiler SPAudioDataType

if [[ "$backend" == "coreaudio" ]]; then
  [[ "$(uname -s)" == "Darwin" ]] || { echo "Core Audio exige macOS" >&2; exit 1; }
fi

if [[ -n "${AUDIO_DEVICE_NAME:-}" ]]; then
  system_profiler SPAudioDataType | grep -F -- "$AUDIO_DEVICE_NAME" >/dev/null || {
    echo "Dispositivo configurado não encontrado: $AUDIO_DEVICE_NAME" >&2
    exit 1
  }
fi

echo "macOS $backend preflight: ok"
