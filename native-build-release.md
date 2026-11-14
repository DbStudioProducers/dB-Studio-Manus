# Build e empacotamento nativo

Os scripts desta etapa não criam extensões falsas nem confundem bundle web com instalador. Eles compilam somente quando a toolchain necessária existe e o empacotador falha caso nenhum artefato nativo seja encontrado.

## Desktop Tauri

```bash
pnpm native:build:desktop
```

Requer Rust, Cargo, Tauri CLI e as dependências do sistema. O target depende do host: Windows/MSVC gera `.msi`/`.exe`, macOS/Xcode gera `.dmg`/app bundle, e Linux gera `.AppImage`, `.deb` ou `.rpm` conforme a configuração.

## Android

Build local:

```bash
pnpm native:build:android
```

Requer Android SDK/ADB, `ANDROID_HOME` ou `ANDROID_SDK_ROOT` e um dispositivo/emulador quando o fluxo local usar `expo run:android`.

Build remoto assinado com EAS:

```bash
DBSTUDIO_USE_EAS=1 pnpm native:build:android
```

O perfil `production` gera AAB; o perfil `preview` pode ser selecionado com `DBSTUDIO_EAS_PROFILE=preview` para APK interno. O EAS exige login e credenciais configurados fora do repositório.

## iOS

Build local:

```bash
pnpm native:build:ios
```

Requer macOS, Xcode, CocoaPods e certificados/provisioning.

Build remoto assinado com EAS:

```bash
DBSTUDIO_USE_EAS=1 pnpm native:build:ios
```

## Empacotamento

Depois que um build real produzir artefatos:

```bash
pnpm native:package
```

O script coleta bundles Tauri, APK/AAB, IPA/xcarchive, cria um arquivo-fonte, gera `BUILD-INFO.txt` e valida `SHA256SUMS`. A saída padrão é `release-native/` e fica fora do Git quando o diretório está ignorado.

## Fluxo completo

```bash
pnpm native:build:desktop
DBSTUDIO_USE_EAS=1 DBSTUDIO_EAS_PROFILE=preview pnpm native:build:android
DBSTUDIO_USE_EAS=1 pnpm native:build:ios
pnpm native:package ./release-native
```

A camada de áudio nativo — ASIO/Core Audio no servidor e Oboe/Audio Unit no mobile — não é gerada por estes scripts; ela exige implementação e validação separadas.

## E2E do streaming de controle

Para validar o contrato usado pelo cliente Expo contra uma instância real do servidor, execute:

```bash
pnpm test:e2e:control
```

O teste inicia o servidor em portas isoladas, consulta `/api/mix`, aplica alterações de canal/master/mute, valida `/api/diagnostics`, envia um pacote `DBAU/1 HELLO` e exige `ACK`, e por fim restaura a mixagem. O teste usa um arquivo de estado temporário e não altera a mixagem do Preview.
