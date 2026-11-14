## Runners de hardware nativo

O workflow manual `.github/workflows/native-hardware.yml` usa quatro classes de runners self-hosted: Windows com ASIO, macOS com Core Audio, macOS com iPhone físico para Audio Unit e Linux com Android físico para Oboe. Ele executa preflight de dispositivo/SDK e o smoke test portátil em todos os casos. O smoke test real só é habilitado com `run_driver=true` e exige o caminho configurado em `DBSTUDIO_NATIVE_DRIVER_TEST_BIN`.

Os labels e as variáveis de runner estão documentados em [`scripts/ci/README.md`](scripts/ci/README.md). Esses hosts não devem aceitar jobs de pull requests não confiáveis. O workflow é manual para evitar filas infinitas em runners ausentes e para exigir intenção explícita antes de abrir hardware de áudio.
