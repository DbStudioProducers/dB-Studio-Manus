#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUTPUT_DIR="${1:-$ROOT_DIR/release-native}"
OUTPUT_DIR="$(mkdir -p "$OUTPUT_DIR" && cd "$OUTPUT_DIR" && pwd)"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

log() { printf '[dB Studio] %s\n' "$*"; }
die() { printf '[dB Studio] ERRO: %s\n' "$*" >&2; exit 1; }

cd "$ROOT_DIR"
[ -d src-tauri ] || die 'src-tauri não encontrado'
[ -d mobile ] || die 'mobile não encontrado'

rm -rf "$OUTPUT_DIR"/*
mkdir -p "$TMP_DIR/artifacts/desktop" "$TMP_DIR/artifacts/android" "$TMP_DIR/artifacts/ios" "$TMP_DIR/source"

# Tauri usa targets/release/bundle/<format> conforme a plataforma host.
DESKTOP_FOUND=0
for bundle_dir in "$ROOT_DIR/src-tauri/target/release/bundle" "$ROOT_DIR/target/release/bundle"; do
  if [ -d "$bundle_dir" ]; then
    while IFS= read -r -d '' artifact; do
      cp -a "$artifact" "$TMP_DIR/artifacts/desktop/"
      DESKTOP_FOUND=1
    done < <(find "$bundle_dir" -maxdepth 2 -type f \( -name '*.AppImage' -o -name '*.deb' -o -name '*.rpm' -o -name '*.msi' -o -name '*.exe' -o -name '*.dmg' -o -name '*.app.tar.gz' \) -print0)
  fi
done

ANDROID_FOUND=0
while IFS= read -r -d '' artifact; do
  cp -a "$artifact" "$TMP_DIR/artifacts/android/"
  ANDROID_FOUND=1
done < <(find "$ROOT_DIR/mobile/android" "$ROOT_DIR/android" -type f \( -name '*.apk' -o -name '*.aab' \) -print0 2>/dev/null || true)

IOS_FOUND=0
while IFS= read -r -d '' artifact; do
  cp -a "$artifact" "$TMP_DIR/artifacts/ios/"
  IOS_FOUND=1
done < <(find "$ROOT_DIR/mobile/ios" "$ROOT_DIR/ios" \( -type f -name '*.ipa' -o -type d -name '*.xcarchive' \) -print0 2>/dev/null || true)

if [ "$DESKTOP_FOUND" -eq 0 ] && [ "$ANDROID_FOUND" -eq 0 ] && [ "$IOS_FOUND" -eq 0 ]; then
  die 'nenhum artefato nativo encontrado. Execute scripts/build_native.sh em um host com as toolchains necessárias.'
fi

# O fonte sempre representa o commit atual; não inclui node_modules ou segredos.
if git diff --quiet && git diff --cached --quiet; then
  git archive --format=tar.gz --prefix=dbstudio-source/ -o "$TMP_DIR/source/dbstudio-source.tar.gz" HEAD
  SOURCE_NOTE="git archive do commit $(git rev-parse HEAD)"
else
  tar --exclude='./.git' --exclude='./node_modules' --exclude='./mobile/node_modules' --exclude='./dist' --exclude='./mobile/dist' --exclude='./.env' --exclude='./.env.*' --exclude='./release-*' -czf "$TMP_DIR/source/dbstudio-source-working-tree.tar.gz" -C "$ROOT_DIR" .
  SOURCE_NOTE="working tree atual (não limpo); artefatos nativos ainda são os já gerados"
fi

mkdir -p "$TMP_DIR/metadata"
cat > "$TMP_DIR/metadata/BUILD-INFO.txt" <<EOF
Project: dB Studio
Version: $(node -p 'require("./package.json").version')
Commit: $(git rev-parse HEAD)
Built at UTC: $(date -u +%Y-%m-%dT%H:%M:%SZ)
Source: $SOURCE_NOTE
Desktop artifacts found: $DESKTOP_FOUND
Android artifacts found: $ANDROID_FOUND
iOS artifacts found: $IOS_FOUND
Native audio: not included; ASIO/Core Audio/Oboe/Audio Unit remain separate implementation work
Verification: pnpm check and pnpm test are required by scripts/build_native.sh before desktop build; mobile typecheck is required before mobile build
EOF

cp -a "$TMP_DIR/artifacts/." "$OUTPUT_DIR/"
cp -a "$TMP_DIR/source/." "$OUTPUT_DIR/"
cp -a "$TMP_DIR/metadata/BUILD-INFO.txt" "$OUTPUT_DIR/"

cd "$OUTPUT_DIR"
find . -type f -not -name SHA256SUMS -print0 | sort -z | xargs -0 sha256sum > SHA256SUMS
sha256sum -c SHA256SUMS

log "Artefatos empacotados em $OUTPUT_DIR"
find . -maxdepth 3 -type f -printf '%p\n' | sort
