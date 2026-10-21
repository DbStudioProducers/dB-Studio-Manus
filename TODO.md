# dB Studio — resultados

## 1. Cockpit do técnico e navegação do produto

- [ ] O produto deve se chamar **dB Studio** e usar uma interface original, moderna, escura, limpa, de alto contraste, otimizada para palco e pouca luz.
- [ ] O shell deve oferecer Dashboard, Audio Devices, Band Devices, Mixer, Mixes Bank, Presets, Palcos, Rede/Diagnóstico, Relatórios, Configurações e Ajuda/Onboarding.
- [ ] O usuário deve conseguir alternar o foco entre operação do servidor e operação mobile/performance sem perder o estado da sessão.
- [ ] A interface deve responder em telas desktop, tablet e mobile, com controles grandes e feedback imediato.

## 2. Dashboard de sessão e saúde do sistema

- [ ] O dashboard deve mostrar sessão ativa, palco, mix em foco, estado do áudio, sample rate, buffer, canais, latência, dropouts, CPU e uso de rede.
- [ ] Deve exibir medidores de nível e estado do driver/dispositivo, além de alertas de instabilidade, bateria baixa e perda de conexão.
- [ ] Deve suportar estado offline de preparação, deixando claro quando a integração nativa de áudio ainda não está conectada.

## 3. Band Devices e controle remoto

- [ ] Deve exibir músicos/dispositivos conectados com nome, dispositivo, bateria, Wi-Fi, latência, status e mix ativa.
- [ ] Deve suportar no mínimo 16 slots/mixagens estéreo independentes no modelo de dados e na tela.
- [ ] Deve oferecer renomear, atribuir mixagem, convidar, bloquear e desconectar como ações de operação.
- [ ] O técnico deve conseguir abrir qualquer mixagem, copiar uma mixagem e enviar presets ou mensagens curtas.

## 4. Mixer pessoal e processamento

- [ ] Cada canal deve ter volume, mute, solo, pan, favorito e reset rápido; o mixer deve ter busca e modo performance.
- [ ] Deve haver master volume, mute global, lock, medidor estéreo, latência, conexão e bateria.
- [ ] A UI deve representar EQ de 4 bandas, compressor, reverb, delay, limiter, A/B e Flat como superfícies configuráveis.
- [ ] Deve haver proteção contra clipping/volume excessivo na linguagem visual e feedback de ganho/redução.

## 5. Mixes Bank, presets e portabilidade

- [ ] Deve permitir criar, duplicar, renomear e excluir mixagens; salvar snapshots com canais, nomes, ícones e parâmetros.
- [ ] Deve organizar mixagens por música, ensaio, banda, integrante ou show e indicar salvamento local/backup.
- [ ] Deve oferecer presets de canal e master, incluindo Bright & Tight, Wide Stage, Warm Vocals, Drums Forward, Natural, Club, Worship e Custom.
- [ ] Deve haver ações de salvar, editar, duplicar, renomear, compartilhar e aplicar preset com um toque.
- [ ] A arquitetura deve deixar preparado export/import JSON e portabilidade sem depender de nuvem.

## 6. Modo Ensaio, palcos e relatórios

- [ ] O Modo Ensaio deve mostrar click configurável, setlist, andamento, tom, notas, marcações e timer.
- [ ] Deve existir suporte conceitual a múltiplos palcos/áreas, músicos e permissões por palco.
- [ ] Relatórios devem apresentar duração, latência média, perda de pacotes, dropouts, alertas, mixagens e configurações, com base para PDF/CSV/JSON.

## 7. Rede, onboarding, acessibilidade e internacionalização

- [ ] O onboarding deve orientar Wi-Fi 5 GHz dedicado, Ethernet CAT6, posicionamento do roteador, modo avião, Wi-Fi ligado, Bluetooth/GPS/AirDrop desligados e apps em segundo plano fechados.
- [ ] A interface deve indicar descoberta automática, IP manual, reconexão, buffer adaptativo, autenticação por código/QR/senha, tráfego de controle criptografado e modo convidado.
- [ ] Deve prever fontes grandes, alto contraste, controles ampliados, teclado no desktop, rótulos claros, confirmação de ações destrutivas e suporte a leitores de tela.
- [ ] A base de textos deve estar em português do Brasil e preparada para inglês/espanhol e formatos locais.

## 8. Fundação técnica

- [ ] O projeto deve manter Express/tRPC, banco selecionado, health check e separação clara entre UI simulada e integrações nativas futuras.
- [ ] O caminho futuro deve acomodar engine nativa desktop (ASIO/Core Audio), app mobile com módulos nativos, streaming UDP de baixa latência, WebSocket/TCP, SQLite local, TLS, tokens e estado autoritativo no servidor.
- [ ] O projeto deve manter manifesto de rotas, configuração de logo e documentação atualizada.
- [ ] `pnpm check`, build e testes existentes devem permanecer executáveis; falhas devem ser tratadas antes da entrega.

## 9. Vertical conjunta do aplicativo

- [x] O servidor desktop deve continuar disponível no console web e possuir uma rota dedicada `/server`.
- [x] O aplicativo do músico deve possuir uma rota dedicada `/mobile`, com conexão por código, estado de servidor, palco, latência, qualidade de rede e bateria.
- [x] O músico deve conseguir controlar master, proteção de volume, mute global, volume individual, mute individual, favoritos e abrir detalhes de canal.
- [x] O app mobile deve apresentar diagnóstico com latência, perda, buffer, sample rate e recomendação de uso de fones com fio.
- [x] O servidor deve iniciar um transporte UDP local com framing versionado, handshake HELLO/ACK, contagem de pacotes, clientes e endpoint `/api/udp/status`.
- [x] A UI deve declarar quando está usando a ponte de Preview e não mascarar a ausência dos adapters nativos ASIO/Core Audio/Oboe/Audio Unit.
- [x] O manifesto `manus-routes.json` deve incluir `/server` e `/mobile`, e `pnpm check`, testes, build e health check devem permanecer executáveis.
