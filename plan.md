# dB Studio — plano de implementação

## Objetivo

Entregar uma primeira versão navegável e funcional do dB Studio que demonstre o cockpit do técnico e o mixer pessoal do músico no navegador, com estado local simulado, navegação entre módulos, controles interativos, diagnóstico e responsividade. A camada nativa de captura/transmissão de áudio (ASIO/Core Audio, UDP de baixa latência e builds desktop/mobile) ficará explicitamente separada como integração de produção, sem mascarar a ausência dessa camada no protótipo.

## Abordagem

- **Frontend:** React + TypeScript + Tailwind, mantendo o starter web-db-user.
- **Estado:** estado local React para músicos, dispositivos, canais, snapshots, presets, sessão de ensaio e preferências; ações com feedback imediato e persistência local quando fizer sentido.
- **Backend:** preservar Express/tRPC, health check e banco habilitado para a próxima etapa. O dashboard atual usará fixtures tipadas para funcionar offline na rede local e permitir evolução para queries tRPC sem reescrever o domínio.
- **Domínio:** tipos e dados de demonstração modelam 16 slots de músicos, canais, níveis, alertas, presets e diagnósticos. O servidor é a fonte autoritativa na arquitetura futura.
- **Rotas:** dashboard, mixer, dispositivos, banco de mixagens, presets, ensaio, relatórios e configurações como estados navegáveis no mesmo app; `manus-routes.json` declara as páginas públicas do SPA.
- **Qualidade:** TypeScript strict, `pnpm check`, build Vite/Express e inspeção visual do Preview depois que o servidor estiver escutando.

## Direção visual

### Estilos considerados

1. **Stagecraft Control Room — 0,07:** console de palco escuro, telemetria densa e acentos ciano.
2. **Studio Editorial — 0,06:** painel claro, tipografia editorial e foco em biblioteca de presets.
3. **Nightflight Minimal — 0,04:** navegação quase monocromática e grandes blocos de foco.

### Escolha: Stagecraft Control Room

- **Movimento de design:** interfaces de console profissional, com precisão de instrumentação e ritmo de sinal.
- **Princípios:** leitura instantânea; densidade controlada; ações reversíveis; contraste para baixa luz.
- **Filosofia de cor:** grafite e carvão reduzem fadiga; ciano-água é a assinatura ativa; âmbar comunica atenção; vermelho fica reservado a mute/risco.
- **Paradigma de layout:** rail lateral compacto + cabeçalho de sessão + canvas assimétrico de cartões operacionais; o mixer usa canais verticais e uma coluna de sinal ao vivo em vez de um grid genérico.
- **Elementos assinatura:** linha de pulso ciano, chips de status com ponto luminoso e medidores verticais/LED.
- **Interação:** controles têm resposta imediata, valores numéricos visíveis e estados claros de lock/mute; ações destrutivas ficam em menus secundários.
- **Animação:** transições de 160–220ms, pulso sutil nos medidores, sem animações decorativas durante performance.
- **Tipografia:** sans geométrica de alta legibilidade para títulos e UI; mono compacta para níveis, latência e telemetria. Fallbacks locais evitam dependência externa.
- **Essência de marca:** “sua mixagem, no ponto certo, antes do primeiro acorde”; preciso, confiável, discreto.
- **Voz:** direta, técnica e tranquilizadora. Exemplos: “Tudo pronto para o ensaio.” / “Atenção: 2 dispositivos pedem revisão.”
- **Wordmark/marca:** wordmark `dB` em caixa baixa com um traço de pulso atravessando a haste do `d`, acompanhado de `STUDIO` espaçado.
- **Cor proprietária:** aqua de sinal `#5CF2C2`, usado como ação primária e fio condutor visual.

## Estrutura principal

- `client/src/App.tsx`: shell, navegação de módulos e estado de sessão.
- `client/src/pages/Home.tsx`: dashboard do técnico e superfícies de interação do MVP.
- `client/src/index.css`: tokens, responsividade, estilos de console, medidores e componentes de mixer.
- `client/src/lib/`: utilitários e tipos compartilhados do frontend.
- `server/routers.ts`: ponto de extensão tRPC para persistência de projetos, presets e relatórios.
- `drizzle/schema.ts`: usuários existentes e futura modelagem de projetos/sessões.
- `public/manus-routes.json`: manifesto de rotas navegáveis.
- `app.config.ts`: metadado de logo do projeto.

## Entregas desta etapa

1. Shell visual completo com identidade dB Studio.
2. Dashboard com saúde do sistema, estado de áudio, dispositivos e alertas.
3. Mixer pessoal com canais, faders, mute/solo, pan, favoritos e master.
4. Navegação para dispositivos, mixes, presets, ensaio, relatórios e configurações, com superfícies úteis e estados demonstráveis.
5. Responsividade para desktop, tablet e mobile, incluindo modo performer.
6. Documentação de escopo e base técnica para a próxima etapa nativa.

## Vertical 2 — servidor desktop + app mobile demonstrável

A evolução desta etapa mantém o console do técnico em `/` e adiciona o cliente do músico em `/mobile`. O servidor Express ganha um transporte UDP local inicial (`server/udp.ts`) com framing DBAU/1, handshake HELLO/ACK, contagem de pacotes e endpoint de telemetria. A interface mobile demonstra conexão por código, estado da sessão, master protegido, canais pessoais, mute, faders, EQ e diagnóstico. O código de transporte não é apresentado como captura ASIO/Core Audio nem como áudio PCM de produção: ele prepara o contrato e a observabilidade para os adapters nativos seguintes.
