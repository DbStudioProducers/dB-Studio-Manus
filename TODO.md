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
- [x] Validar a vertical com typecheck, 11 testes automatizados, build web e smoke test HTTP.
- [x] Persistir o snapshot em arquivo JSON local configurável por `MIX_STATE_FILE`, sobrevivendo ao reinício do servidor; migrar para SQLite continua opcional para múltiplos usuários.

## 12. Integração E2E do streaming de controle

- [x] Iniciar uma instância isolada do servidor desktop com HTTP e UDP em portas dedicadas.
- [x] Simular o cliente Expo com leitura e escrita de mixagem via HTTP.
- [x] Validar diagnóstico, handshake `DBAU/1 HELLO/ACK`, contadores de pacotes e reset da mixagem.
- [x] Encerrar o processo isolado sem deixar serviços órfãos.

## 13. Pipeline CI/CD

- [x] Criar CI para typecheck, testes unitários, E2E HTTP/UDP, build web e export Expo.
- [x] Criar release nativo por tag/manual para Tauri em Linux/Windows/macOS e EAS Android/iOS.
- [x] Publicar instaladores e metadados como artefatos do workflow, sem incluir segredos no repositório.
- [x] Documentar Secrets, configuração EAS, governança de submissão e limitações de validação de áudio.
- [ ] Conectar o projeto a um repositório GitHub e configurar `EXPO_TOKEN`, credenciais EAS e `projectId` real.

## 14. Robustez inicial do protocolo DBAU

- [x] Validar magic e versão dos pacotes antes de processá-los.
- [x] Criar sessão UDP no HELLO e acompanhar o maior sequence por cliente.
- [x] Rejeitar replay e reordenação de pacotes de áudio.
- [x] Expor contadores de áudio aceito, pacotes descartados e pacotes inválidos no diagnóstico.
- [x] Validar no E2E um pacote de áudio sintético aceito, dois descartados e uma versão inválida rejeitada.
- [ ] Adicionar token de sessão, proteção criptográfica contra replay, jitter buffer e callback para o núcleo de áudio nativo.

## 15. Token de sessão e autenticação contra replay

- [x] Emitir token aleatório de sessão com validade temporária pelo endpoint `/api/udp/join`.
- [x] Exigir token binário no pacote HELLO antes de criar a sessão UDP.
- [x] Autenticar pacotes de áudio com HMAC-SHA256 usando o token da sessão.
- [x] Manter proteção de sequência para bloquear replay e reordenação após a autenticação.
- [x] Validar no E2E sessão válida, pacote HMAC aceito, assinatura inválida, token ausente, replay e versão inválida.
- [ ] Transportar o token por canal de controle TLS/HTTPS em produção e substituir HMAC isolado por SRTP/DTLS para confidencialidade e proteção completa do áudio.

## 16. Camada nativa de áudio

- [x] Criar `native/audio-core` com mixer estéreo determinístico, gain, pan, mute, master, métricas RMS/peak e xruns.
- [x] Garantir que o callback do núcleo não faça alocação, lock, I/O ou chamadas de UI.
- [x] Criar contrato comum e adapters condicionais para ASIO, Core Audio, Oboe/AAudio e Audio Unit.
- [x] Adicionar fallback portátil explícito para ambientes sem SDK de áudio.
- [x] Adicionar smoke test C++ ao CI e executar com `g++` no Sandbox.
- [ ] Abrir dispositivos reais, instalar callbacks e ligar ring buffers em hosts Windows/macOS/Android/iOS.
- [ ] Validar latência, xruns, desconexão e sample rate efetivo com hardware real.

## 17. Runners de hardware nativo no CI

- [x] Criar workflow manual para Windows/ASIO, macOS/Core Audio, iOS/Audio Unit e Android/Oboe.
- [x] Adicionar preflight de SDK, dispositivo conectado, autorização e labels self-hosted.
- [x] Separar preflight portátil de execução de driver real com `run_driver` explícito.
- [x] Documentar labels, variáveis, isolamento e procedimento de registro dos runners.
- [ ] Registrar os quatro runners self-hosted, conectar hardware físico e configurar variáveis do repositório.
- [ ] Implementar e publicar os binários reais de smoke test para cada backend.

## 18. Testes de carga e latência

- [x] Criar benchmark de 16 mixagens a 48 kHz com buffers de 48, 96 e 128 frames.
- [x] Medir p50, p95, p99, máximo e orçamento de callback, com falha acima de 80% do orçamento.
- [x] Executar no Sandbox: no caso de 128 frames, p99 de 0,0831 ms contra orçamento de 2,6667 ms.
- [x] Adicionar o benchmark ao CI comum e aos quatro jobs de hardware.
- [x] Consultar o GitHub: o repositório ainda possui zero runners self-hosted registrados.
- [ ] Reexecutar em Windows/macOS/iPhone/Android físicos e medir latência ponta a ponta com loopback, xruns, dropouts e jitter.
