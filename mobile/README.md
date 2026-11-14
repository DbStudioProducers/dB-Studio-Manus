# dB Studio Mobile — Expo / React Native

Cliente nativo do músico para Android e iOS. A tela principal implementa conexão ao servidor local, obtenção de token temporário em `/api/udp/join`, leitura periódica de `/api/udp/status` e `/api/mix`, master, mute global, mute por canal e atualizações de mixagem protegidas por `revision`.

O app já está integrado ao plano de controle HTTP do servidor desktop. O streaming PCM/UDP ainda depende da ponte nativa por plataforma: o token retornado por `/api/udp/join` deve ser usado pelo módulo Audio Unit/Oboe no telefone para enviar o HELLO e iniciar o fluxo DBAU/1 autenticado. A integração HTTP não deve ser interpretada como áudio ponta a ponta validado.

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
