#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_DIR="${ROOT}/.native-build/audio-core"
CXX="${CXX:-g++}"

mkdir -p "${BUILD_DIR}"
"${CXX}" -std=c++17 -O2 -Wall -Wextra -Wpedantic \
  -I"${ROOT}/native/audio-core" \
  -I"${ROOT}/native/audio-host" \
  "${ROOT}/native/audio-core/audio_core.cpp" \
  "${ROOT}/native/audio-host/portable_host.cpp" \
  "${ROOT}/native/audio-core/smoke_test.cpp" \
  -o "${BUILD_DIR}/audio-core-smoke"

"${BUILD_DIR}/audio-core-smoke"
