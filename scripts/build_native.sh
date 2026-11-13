#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET="${1:-all}"
MOBILE_DIR="$ROOT_DIR/mobile"
USE_EAS="${DBSTUDIO_USE_EAS:-0}"
EAS_PROFILE="${DBSTUDIO_EAS_PROFILE:-production}"

log() { printf '\n[dB Studio] %s\n' "$*"; }
die() { printf '\n[dB Studio] ERRO: %s\n' "$*" >&2; exit 1; }
need_cmd() { command -v "$1" >/dev/null 2>&1 || die "comando ausente: $1"; }

case "$TARGET" in
  desktop|android|ios|all) ;;
  *) die "alvo inválido '$TARGET'. Use desktop, android, ios ou all." ;;
esac

build_desktop() {
  log "Construindo frontend e servidor para o shell Tauri"
  need_cmd pnpm
  need_cmd cargo
  cargo tauri --version >/dev/null 2>&1 || die "Tauri CLI ausente. Instale-a com 'cargo install tauri-cli --version '^2'' ou use a ferramenta oficial da sua plataforma."
  (cd "$ROOT_DIR" && pnpm check && pnpm test && pnpm build)
  log "Gerando bundle Tauri"
  (cd "$ROOT_DIR" && cargo tauri build --manifest-path src-tauri/Cargo.toml)
}

prepare_mobile() {
  need_cmd pnpm
  [ -f "$MOBILE_DIR/package.json" ] || die "mobile/package.json não encontrado"
  (cd "$ROOT_DIR" && pnpm --dir mobile typecheck)
}

build_android() {
  prepare_mobile
  if [ "$USE_EAS" = "1" ]; then
    need_cmd npx
    log "Gerando Android com EAS profile '$EAS_PROFILE'"
    (cd "$MOBILE_DIR" && npx eas-cli build --platform android --profile "$EAS_PROFILE" --non-interactive)
  else
    need_cmd npx
    need_cmd adb
    [ -n "${ANDROID_HOME:-}${ANDROID_SDK_ROOT:-}" ] || die "ANDROID_HOME ou ANDROID_SDK_ROOT não definido; use DBSTUDIO_USE_EAS=1 para EAS."
    log "Gerando Android localmente"
    (cd "$MOBILE_DIR" && npx expo prebuild --platform android --non-interactive && npx expo run:android --variant release)
  fi
}

build_ios() {
  prepare_mobile
  if [ "$USE_EAS" = "1" ]; then
    need_cmd npx
    log "Gerando iOS com EAS profile '$EAS_PROFILE'"
    (cd "$MOBILE_DIR" && npx eas-cli build --platform ios --profile "$EAS_PROFILE" --non-interactive)
  else
    need_cmd npx
    need_cmd xcodebuild
    [ "$(uname -s)" = "Darwin" ] || die "build iOS local exige macOS/Xcode; use DBSTUDIO_USE_EAS=1 para EAS."
    log "Gerando iOS localmente"
    (cd "$MOBILE_DIR" && npx expo prebuild --platform ios --non-interactive && npx expo run:ios --configuration Release)
  fi
}

case "$TARGET" in
  desktop) build_desktop ;;
  android) build_android ;;
  ios) build_ios ;;
  all)
    build_desktop
    build_android
    build_ios
    ;;
esac

log "Build concluído para o alvo '$TARGET'. Execute scripts/package_native.sh para empacotar os artefatos."
