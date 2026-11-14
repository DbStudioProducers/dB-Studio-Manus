# dB Studio — plataformas nativas

## Estrutura criada

`src-tauri/` contém o shell desktop Tauri 2 para Windows, macOS e Linux. Ele reutiliza `dist/public`, preserva o Express como plano de controle local e expõe o comando nativo `desktop_status`.

`mobile/` contém o cliente Expo/React Native para Android e iOS. Ele possui identificadores nativos, ícones, splash, permissões de rede local/foreground audio e uma tela funcional do músico com telemetria HTTP ao servidor.

## Comandos de desenvolvimento

Na raiz:

```bash
pnpm native:desktop:dev
pnpm native:desktop:build
pnpm native:mobile:install
pnpm native:mobile:typecheck
pnpm native:mobile:start
```

Dentro de `mobile/`:

```bash
pnpm android
pnpm ios
pnpm export:web
```

## Scripts de release nativo

Os comandos oficiais estão documentados em `native-build-release.md`. `scripts/build_native.sh` valida pré-requisitos e executa Tauri, Expo local ou EAS conforme o alvo. `scripts/package_native.sh` coleta somente artefatos reais (`.AppImage`, `.deb`, `.rpm`, `.msi`, `.exe`, `.dmg`, `.apk`, `.aab`, `.ipa` e `.xcarchive`), gera metadados e valida SHA-256. Se nenhuma toolchain ou nenhum artefato existir, o script termina com erro explícito.

```bash
pnpm native:build:desktop
DBSTUDIO_USE_EAS=1 pnpm native:build:android
DBSTUDIO_USE_EAS=1 pnpm native:build:ios
pnpm native:package ./release-native
```

## Estado comprovado

O typecheck do projeto web e do app Expo passa; o export web do Expo também passa e gera `mobile/dist`. O shell Tauri está configurado, mas a compilação depende de Rust/Cargo. APK/AAB exigem Android SDK/ADB ou EAS Build com credenciais. iOS exige macOS/Xcode, certificados e provisioning.

## Limite técnico importante

Esta etapa cria os shells e a integração de controle/telemetria. O áudio em tempo real ainda não está implementado no módulo nativo: o app mobile consulta `/api/udp/status`, mas não recebe PCM UDP. O próximo bloco é implementar `audio-core`, receptor Oboe/AAudio para Android, Audio Unit/AVAudioSession para iOS e ASIO/Core Audio para o servidor desktop.
