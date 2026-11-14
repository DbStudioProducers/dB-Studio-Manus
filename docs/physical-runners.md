# Runners físicos do dB Studio

Este documento descreve a configuração necessária para executar `.github/workflows/native-hardware.yml` com hardware real. O registro do runner é feito no GitHub; o iPhone e o Android são dispositivos conectados a um runner macOS/Linux e não runners independentes.

## Topologia

| Job | Máquina do runner | Dispositivo/hardware | Labels obrigatórios |
| --- | --- | --- | --- |
| `windows-asio` | Windows x64 dedicado | Interface com driver ASIO | `self-hosted, windows, x64, asio-audio` |
| `macos-coreaudio` | Mac Apple Silicon | Interface Core Audio | `self-hosted, macos, arm64, coreaudio-audio` |
| `ios-audiounit` | Mac Apple Silicon dedicado | iPhone pareado no Xcode | `self-hosted, macos, arm64, ios, audio-unit` |
| `android-oboe` | Linux x64 dedicado | Android autorizado pelo ADB | `self-hosted, linux, x64, android, oboe-audio` |

Mantenha o repositório privado enquanto os runners tiverem acesso a interfaces, telefones, certificados ou outros recursos da rede local. Não habilite workflows de pull request de forks nesses hosts. O workflow de hardware é manual (`workflow_dispatch`) por desenho.

## Registro no GitHub

No repositório, abra **Settings → Actions → Runners → New self-hosted runner**, selecione o sistema e a arquitetura e execute os comandos exibidos pelo GitHub na própria máquina. O token de registro é temporário; nunca o versionar nem reutilizar depois de expirado.

Durante a configuração, defina o nome único do host e os labels correspondentes. A configuração equivalente, depois de substituir os valores gerados pelo GitHub, é:

```bash
./config.sh --url https://github.com/DbStudioProducers/dB-Studio-Manus \
  --token TOKEN_TEMPORARIO \
  --name dbstudio-linux-android \
  --labels self-hosted,linux,x64,android,oboe-audio \
  --unattended
```

No Windows, use `config.cmd` em um PowerShell como administrador e prefira `C:\actions-runner`. Instale o runner como serviço. No macOS/Linux, instale e inicie o serviço com os scripts fornecidos pelo pacote do runner. Confirme no GitHub que o estado ficou **Idle** ou **Online** antes de disparar um job.

## Variáveis do repositório

Cadastre em **Settings → Secrets and variables → Actions → Variables**:

```text
DBSTUDIO_ASIO_SDK_DIR       # caminho no Windows, se o adapter exigir o SDK
DBSTUDIO_ASIO_DRIVER_NAME   # nome do driver/interface ASIO alvo
DBSTUDIO_MAC_AUDIO_DEVICE   # nome exato no system_profiler, opcional
DBSTUDIO_IOS_UDID           # UDID do iPhone pareado ao Mac
DBSTUDIO_ANDROID_SERIAL     # serial retornado por adb devices -l
DBSTUDIO_NATIVE_DRIVER_TEST_BIN # caminho local do smoke test real
```

Certificados Apple, chaves privadas e tokens nunca devem ser armazenados como variáveis comuns. Use Secrets ou o mecanismo de assinatura da máquina. O caminho de `DBSTUDIO_NATIVE_DRIVER_TEST_BIN` precisa existir no host que executa o job; não é um caminho do repositório.

## Windows / ASIO

Instale Node.js 22, pnpm 10.18.0, Git, toolchain C++, o driver oficial da interface e o SDK ASIO se necessário. Conecte a interface antes do job e confirme que ela aparece no Gerenciador de Dispositivos.

```powershell
pnpm install --frozen-lockfile
pnpm native:test:audio-core
pnpm native:test:audio-load
./scripts/ci/preflight-windows-asio.ps1
```

O preflight exige pelo menos um dispositivo de áudio Windows em estado `OK`. Comece no Actions com `target=windows-asio` e `run_driver=false`. Só use `run_driver=true` depois de instalar o binário real e configurar `DBSTUDIO_NATIVE_DRIVER_TEST_BIN`.

## macOS / Core Audio

Instale o Xcode compatível, Node.js 22, pnpm 10.18.0, Git e a interface de áudio. Desative suspensão automática e mantenha sample rate e buffer fixos no dispositivo.

```bash
system_profiler SPAudioDataType
pnpm install --frozen-lockfile
pnpm native:test:audio-core
pnpm native:test:audio-load
bash scripts/ci/preflight-macos-audio.sh coreaudio
```

Se `DBSTUDIO_MAC_AUDIO_DEVICE` for usada, seu valor precisa corresponder ao nome exibido por `system_profiler SPAudioDataType`. Execute primeiro `target=macos-coreaudio` com `run_driver=false`.

## macOS / iPhone / Audio Unit

O iPhone é conectado ao runner macOS. No iPhone:

1. Ative **Settings → Privacy & Security → Developer Mode** e reinicie.
2. Conecte por USB e aceite **Trust This Computer**.
3. No Xcode, abra **Device Hub** e pareie o dispositivo.
4. Faça login em **Xcode → Settings → Apple Accounts**.
5. Configure signing, bundle identifier e provisioning profile.
6. Obtenha o UDID e cadastre `DBSTUDIO_IOS_UDID`.

No Mac, valide:

```bash
xcodebuild -version
xcrun xctrace list devices
bash scripts/ci/preflight-ios-audio.sh
```

A saída precisa conter o UDID e o dispositivo não pode estar `Unavailable`, `Disconnected` ou não confiável. Execute `target=ios-audiounit` com `run_driver=false` antes de habilitar o smoke test. O primeiro smoke test deve abrir a sessão Audio Unit e registrar rota, sample rate, buffer, interrupções e falhas de reprodução.

## Linux / Android / Oboe

Instale Node.js 22, pnpm 10.18.0, Git, Android SDK, Platform Tools, NDK e CMake/Ninja. Conecte um Android dedicado por USB.

No Android:

1. Toque sete vezes em **Build number**.
2. Abra **Developer options**.
3. Ative **USB debugging**.
4. Conecte o telefone e aceite a chave RSA.
5. Mantenha o aparelho desbloqueado durante o pareamento inicial.

No Linux:

```bash
adb start-server
adb devices -l
adb -s SERIAL get-state
bash scripts/ci/preflight-android-oboe.sh
```

O estado esperado é `device`. Cadastre o serial em `DBSTUDIO_ANDROID_SERIAL`. Prefira USB até a validação ficar estável; o ADB por Wi-Fi deve ser introduzido depois, pois adiciona variáveis à análise de latência.

## Sequência de ativação

1. Registre um runner por vez e confirme **Online/Idle** no GitHub.
2. Execute o preflight de cada plataforma.
3. Execute `native:test:audio-core` e `native:test:audio-load`.
4. Execute o job com `run_driver=false`.
5. Instale e valide o binário real de smoke test.
6. Execute `run_driver=true` para uma plataforma por vez.
7. Só depois faça o teste de loopback físico ponta a ponta.

O benchmark portátil mede o custo do mixer em CPU, mas não comprova a latência do driver, Wi-Fi, jitter, xrun, dropout ou Audio Unit/Oboe/ASIO real. O relatório final deve registrar sample rate efetivo, frames por buffer, p50/p95/p99/máximo do callback, xruns, dropouts, jitter e latência ponta a ponta.

## Diagnóstico rápido

- **Runner offline:** verificar serviço do runner, energia, rede de saída HTTPS e relógio do sistema.
- **Windows sem áudio:** verificar driver, cabo USB e estado `OK` no Gerenciador de Dispositivos.
- **iPhone ausente:** desbloquear, repetir Trust, conferir Developer Mode, pareamento no Device Hub e provisioning.
- **Android `unauthorized`:** desbloquear o telefone, aceitar a chave RSA e repetir `adb devices`.
- **Android `offline`:** trocar cabo/porta, reiniciar `adb` e reconectar o aparelho.
- **Smoke test retorna código 2:** configurar `DBSTUDIO_NATIVE_DRIVER_TEST_BIN` no host correto.
