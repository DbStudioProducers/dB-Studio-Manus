## 10. Estrutura nativa desktop e mobile

- [x] Criar shell Tauri 2 em `src-tauri/` com manifesto, janela desktop, bundle, permissões e comando nativo de status.
- [x] Configurar o shell desktop para reutilizar `dist/public` e manter o servidor Express como plano de controle local.
- [x] Criar app Expo/React Native em `mobile/` com entrypoint local, configuração Android/iOS, identificadores, permissões e assets de marca.
- [x] Implementar no app nativo a tela do músico com conexão ao servidor, master, mute global, mute por canal e telemetria.
- [x] Integrar o app mobile ao workspace pnpm e validar `pnpm --dir mobile typecheck` e export web.
- [ ] Compilar o shell Tauri em um host com Rust e toolchain de plataforma.
- [ ] Gerar APK/AAB com Android SDK ou EAS Build e credenciais de assinatura.
- [ ] Gerar IPA/TestFlight em macOS/Xcode com certificados e provisioning.
- [ ] Implementar áudio PCM nativo com ASIO/Core Audio/Oboe/Audio Unit; a tela atual ainda usa HTTP apenas para telemetria.
