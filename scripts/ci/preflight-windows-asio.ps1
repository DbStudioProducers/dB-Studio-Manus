$ErrorActionPreference = "Stop"

if ($env:ASIO_SDK_DIR -and -not (Test-Path $env:ASIO_SDK_DIR)) {
  throw "DBSTUDIO_ASIO_SDK_DIR não existe: $env:ASIO_SDK_DIR"
}

$audioDevices = @(Get-PnpDevice -Class Media -Status OK -ErrorAction SilentlyContinue)
if ($audioDevices.Count -eq 0) {
  throw "Nenhum dispositivo de áudio Windows em estado OK foi encontrado no runner."
}

if (-not $env:ASIO_DRIVER_NAME) {
  Write-Warning "DBSTUDIO_ASIO_DRIVER_NAME não configurado; a presença do driver ASIO será validada pelo binário nativo."
} else {
  Write-Host "ASIO driver alvo: $env:ASIO_DRIVER_NAME"
}

Write-Host "Dispositivos de áudio encontrados: $($audioDevices.Count)"
$audioDevices | Select-Object -First 10 FriendlyName, InstanceId | Format-Table -AutoSize
Write-Host "Windows ASIO preflight: ok"
