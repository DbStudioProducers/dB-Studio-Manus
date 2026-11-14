# dB Studio Mobile — Expo / React Native

Cliente nativo do músico para Android e iOS. A primeira tela implementa conexão ao servidor local, master, mute global, canais pessoais e leitura de `/api/udp/status`.

## Desenvolvimento

Dentro de `mobile/`:

```bash
pnpm install
pnpm start
pnpm android
pnpm ios
```

Defina `EXPO_PUBLIC_API_BASE_URL` para o endereço LAN do servidor dB Studio. Em um aparelho físico, não use `127.0.0.1`; use o IP do computador servidor.

## Builds nativos

```bash
npx expo prebuild
npx expo run:android
npx expo run:ios
```

Para release, use EAS Build ou Android Studio/Xcode com credenciais de assinatura. O Sandbox atual não possui Android SDK/ADB, Xcode/macOS, nem credenciais de publicação.

## Áudio

Esta camada ainda usa HTTP para telemetria e não acessa UDP/PCM diretamente. O receptor nativo de áudio deve ser implementado em módulo C++/Oboe para Android e Audio Unit/AVAudioSession para iOS antes de uso em palco crítico.
