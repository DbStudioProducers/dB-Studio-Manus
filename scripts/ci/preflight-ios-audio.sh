#!/usr/bin/env bash
set -euo pipefail

[[ "$(uname -s)" == "Darwin" ]] || { echo "iOS Audio Unit exige macOS" >&2; exit 1; }
command -v xcodebuild >/dev/null
command -v xcrun >/dev/null
xcodebuild -version
xcrun xctrace list devices

if [[ -z "${IOS_UDID:-}" ]]; then
  echo "DBSTUDIO_IOS_UDID não configurado; defina o UDID do iPhone conectado ao runner." >&2
  exit 1
fi
xcrun xctrace list devices | grep -F -- "$IOS_UDID" >/dev/null || {
  echo "iPhone não encontrado ou não confiável: $IOS_UDID" >&2
  exit 1
}

echo "iOS Audio Unit preflight: ok"
