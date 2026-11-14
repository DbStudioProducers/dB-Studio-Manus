# Auditoria funcional — dB Studio

## Fluxos aprovados

- Rotas do Desktop e do app do músico renderizam após recarga.
- Cadastro inicial do técnico no Desktop via `/api/auth/setup`.
- Login local com senha derivada por `scrypt`, token de sessão aleatório e expiração.
- Cadastro de músicos pelo técnico, com `role`, `mixId`, status e `deviceId`.
- Vínculo do primeiro login do músico ao dispositivo e rejeição de outro dispositivo.
- Join autenticado no protocolo DBAU/1.
- Controle de master, mute global e mute por canal com revisão autoritativa.
- Rejeição de revisão antiga, HMAC, replay e pacotes fora de ordem.
- Export Expo Web e build web principal.
- Smoke test e benchmark do audio-core para 16 mixagens.

## Limites verificados

- O áudio PCM ponta a ponta ainda não é executado por um módulo nativo Oboe/Audio Unit conectado ao callback real. O transporte UDP e o núcleo DSP existem, mas a ponte física precisa de implementação e testes nos runners.
- Algumas ações do painel visual ainda são protótipos locais ou feedback de interface: exportação de relatórios, importação/exportação real de presets, filtros de períodos, abas secundárias de Configurações e determinados controles de EQ/efeitos. Elas não devem ser apresentadas como integração de produção.
- O cadastro de usuários é local ao Desktop e os dados ficam em `data/users.json`, fora do Git. Não há dependência de Internet para autenticação ou controle na rede local.
- Os builds nativos não foram produzidos neste Sandbox: Desktop requer Rust/Cargo + Tauri, Android requer Android SDK/ADB e iOS requer macOS/Xcode.

## Evidência executada

- `pnpm check`
- `pnpm test` — 14 testes aprovados
- `pnpm --dir mobile typecheck`
- `pnpm test:e2e:control`
- `pnpm build`
- `pnpm --dir mobile export:web`
- `pnpm native:test:audio-core`
- `pnpm native:test:audio-load`

Os pacotes web são adequados para testes de fluxo e interface. A validação de áudio real e a entrega de instaladores nativos continuam condicionadas aos runners físicos descritos em `docs/physical-runners.md`.
