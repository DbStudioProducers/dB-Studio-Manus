## 10. Estrutura nativa desktop e mobile

- [x] Criar shell Tauri 2 em `src-tauri/` com manifesto, janela desktop, bundle, permissões e comando nativo de status.
- [x] Configurar o shell desktop para reutilizar `dist/public` e manter o servidor Express como plano de controle local.
- [x] Criar app Expo/React Native em `mobile/` com entrypoint local, configuração Android/iOS, identificadores, permissões e assets de marca.
- [x] Implementar no app nativo a tela do músico com conexão ao servidor, master, mute global, mute por canal e telemetria.
- [x] Integrar o app mobile ao workspace pnpm e validar `pnpm --dir mobile typecheck` e export web.
- [x] Criar scripts reproduzíveis para build Tauri, build local Android/iOS, build remoto EAS e coleta com checksums.
- [ ] Compilar o shell Tauri em um host com Rust e toolchain de plataforma.
- [ ] Gerar APK/AAB com Android SDK ou EAS Build e credenciais de assinatura.
- [ ] Gerar IPA/TestFlight em macOS/Xcode com certificados e provisioning.
- [ ] Implementar áudio PCM nativo com ASIO/Core Audio/Oboe/Audio Unit; a tela atual ainda usa HTTP apenas para telemetria.

## 11. Controle de mixagem sincronizado

- [x] Criar estado autoritativo de mixagem no servidor com master, mute global, canais, revisão e validação de limites.
- [x] Expor leitura, diagnóstico, atualização de master, mute global, mute por canal e reset em endpoints REST locais.
- [x] Conectar o cliente web/mobile aos endpoints para carregar e salvar alterações de mixagem.
- [x] Conectar o cliente Expo nativo ao snapshot e aos comandos de mute/master do servidor.
- [x] Validar a vertical com typecheck, 10 testes automatizados, build web e smoke test HTTP.
- [x] Persistir o snapshot em arquivo JSON local configurável por `MIX_STATE_FILE`, sobrevivendo ao reinício do servidor; migrar para SQLite continua opcional para múltiplos usuários.
