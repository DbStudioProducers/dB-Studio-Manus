param([Parameter(Mandatory=$true)][string]$Backend)
$ErrorActionPreference = "Stop"
$binary = $env:DBSTUDIO_NATIVE_DRIVER_TEST_BIN
if (-not $binary) {
  throw "DBSTUDIO_NATIVE_DRIVER_TEST_BIN não configurado para backend $Backend."
}
if (-not (Test-Path $binary)) {
  throw "Binário não encontrado: $binary"
}
$env:DBSTUDIO_AUDIO_BACKEND = $Backend
& $binary
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
