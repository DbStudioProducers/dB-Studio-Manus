# Runners de hardware nativo

O workflow `.github/workflows/native-hardware.yml` é manual e usa runners self-hosted para evitar que o CI comum fique bloqueado por ausência de hardware. Os labels esperados são:

- `self-hosted, windows, x64, asio-audio`
- `self-hosted, macos, arm64, coreaudio-audio`
- `self-hosted, macos, arm64, ios, audio-unit`
- `self-hosted, linux, x64, android, oboe-audio`

Cada runner deve ser dedicado, ter o GitHub Actions Runner atualizado, aceitar apenas o repositório autorizado e manter o hardware conectado. Nunca exponha esses runners a pull requests não confiáveis.

As variáveis de repositório esperadas são `DBSTUDIO_ASIO_SDK_DIR`, `DBSTUDIO_ASIO_DRIVER_NAME`, `DBSTUDIO_MAC_AUDIO_DEVICE`, `DBSTUDIO_IOS_UDID`, `DBSTUDIO_ANDROID_SERIAL` e `DBSTUDIO_NATIVE_DRIVER_TEST_BIN`. O último caminho aponta para um binário de smoke test nativo construído no host correspondente.

A execução `run_driver=false` faz preflight de SDK/dispositivo e roda o `audio-core` portátil. A execução `run_driver=true` também exige o binário real de smoke test e executa sua abertura de dispositivo, callback, sample rate, buffer e xrun. O repositório ainda não inclui esses binários porque eles dependem dos SDKs e drivers instalados em cada host.

## Registro dos runners

1. Criar quatro hosts dedicados; não usar máquina pessoal para PRs públicos.
2. Instalar driver/interface ASIO no Windows e autorizar o dispositivo.
3. Conectar interface Core Audio ao macOS; para iOS, conectar um iPhone confiável e manter o UDID estável.
4. Conectar um Android físico com USB debugging autorizado.
5. Registrar cada runner com os labels acima.
6. Configurar as variáveis de repositório e, quando disponível, o caminho do binário de smoke test.
7. Executar o workflow manualmente por plataforma.

O preflight não mede latência profissional. O teste de áudio precisa registrar sample rate efetivo, buffer concedido, callback duration, xrun, dropouts e latência ponta a ponta com loopback elétrico.
