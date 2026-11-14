#!/usr/bin/env bash
set -euo pipefail

backend="${1:?backend obrigatório}"
binary="${DBSTUDIO_NATIVE_DRIVER_TEST_BIN:-}"

if [[ -z "$binary" ]]; then
  echo "DBSTUDIO_NATIVE_DRIVER_TEST_BIN não configurado para backend $backend." >&2
  echo "Instale o binário de smoke test do host no runner e configure a variável do repositório antes de usar run_driver=true." >&2
  exit 2
fi

[[ -x "$binary" ]] || { echo "Binário não executável: $binary" >&2; exit 1; }
DBSTUDIO_AUDIO_BACKEND="$backend" "$binary"
