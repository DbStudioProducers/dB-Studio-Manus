# CI/CD do dB Studio

O projeto possui dois workflows em `.github/workflows/`.

## CI contínuo

`ci.yml` roda em todo pull request e push para `main`. Ele instala exatamente o pnpm declarado, executa typecheck web/servidor e Expo, testes unitários, o E2E HTTP/UDP `pnpm test:e2e:control`, build de produção e export web do Expo. Os bundles de verificação ficam disponíveis como artefato do workflow por sete dias.

## Release nativo

`native-release.yml` roda manualmente ou em tags `v*`. O job desktop cria bundles Tauri em três runners independentes: Ubuntu, Windows e macOS. O job mobile usa EAS em runner Ubuntu para gerar Android e iOS em profile `production`, baixar os artefatos e publicá-los como artefatos do workflow. O job final publica `BUILD-INFO.txt` apenas quando todos os jobs nativos passam.

O pipeline não publica automaticamente nas lojas. O input manual `submit_mobile` funciona como ponto de governança e só executa a submissão após uma execução manual explícita. A geração usa `EXPO_TOKEN` como Secret do GitHub; certificados, provisioning e credenciais Android devem permanecer gerenciados pelo EAS. Nenhum token, keystore ou certificado deve ser commitado.

## Configuração necessária no GitHub

1. Conectar o repositório do projeto a um repositório GitHub que execute Actions.
2. Criar o Secret `EXPO_TOKEN` com um token EAS de CI dedicado.
3. Executar `eas init` no diretório `mobile/` uma vez e registrar o `projectId` retornado no `mobile/app.config.ts` ou no app config usado pelo projeto.
4. Configurar no EAS as credenciais Android e iOS e os identificadores de assinatura.
5. Criar uma tag como `v0.2.0` ou iniciar manualmente `dB Studio Native Release`.

## Comandos locais equivalentes

```bash
pnpm check
pnpm --dir mobile typecheck
pnpm test
pnpm test:e2e:control
pnpm build
pnpm native:build:desktop
DBSTUDIO_USE_EAS=1 pnpm native:build:android
DBSTUDIO_USE_EAS=1 pnpm native:build:ios
pnpm native:package ./release-native
```

## Ponto crítico de operação

O pipeline gera instaladores do shell Tauri e builds Expo. O teste E2E valida o plano de controle, o handshake UDP e a filtragem de replay/reordenação com áudio sintético, mas não comprova captura, transporte contínuo, jitter buffer ou reprodução de áudio PCM de baixa latência. Essa validação exige hardware, drivers ASIO/Core Audio/Oboe/Audio Unit e testes de carga em uma rede dedicada.
