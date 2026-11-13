# dB Studio — plataformas nativas

## Estrutura criada

`src-tauri/` contém o shell desktop Tauri 2 para Windows, macOS e Linux. Ele reutiliza `dist/public`, preserva o servidor Express para a API local e expõe o comando nativo `desktop_status`.

`mobile/` contém o cliente Expo/React Native para Android e iOS. Ele possui identificadores nativos, ícones, splash, permissões de rede local/foreground audio e uma tela funcional do músico com telemetria HTTP ao servidor.

## Comandos

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

## Estado comprovado

- O typecheck do projeto web e do app Expo passa.
- O export web do Expo passa e gera `mobile/dist`.
- O shell Tauri está configurado, mas não foi compilado neste Sandbox porque não há `rustc`/`cargo`.
- APK/AAB exigem Android SDK/ADB ou EAS Build com credenciais.
- iOS exige macOS/Xcode, certificados e provisioning.

## Limite técnico importante

Esta etapa cria os shells e a integração de controle/telemetria. O áudio em tempo real ainda não está implementado no módulo nativo: o app mobile consulta `/api/udp/status`, mas não recebe PCM UDP. O próximo bloco é implementar `audio-core`, receptor Oboe/AAudio para Android, Audio Unit/AVAudioSession para iOS e ASIO/Core Audio para o servidor desktop.
