#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_DIR="${ROOT}/.native-build/audio-core"
CXX="${CXX:-g++}"

mkdir -p "${BUILD_DIR}"
"${CXX}" -std=c++17 -O2 -Wall -Wextra -Wpedantic \
  -I"${ROOT}/native/audio-core" \
  "${ROOT}/native/audio-core/audio_core.cpp" \
  "${ROOT}/native/audio-core/load_test.cpp" \
  -o "${BUILD_DIR}/audio-core-load"

AUDIO_LOAD_SECONDS="${AUDIO_LOAD_SECONDS:-30}" \
  AUDIO_SAMPLE_RATE="${AUDIO_SAMPLE_RATE:-48000}" \
  AUDIO_BUFFER_FRAMES="${AUDIO_BUFFER_FRAMES:-128}" \
  AUDIO_MIXES="${AUDIO_MIXES:-16}" \
  "${BUILD_DIR}/audio-core-load"
