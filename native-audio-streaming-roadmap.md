# Roadmap da camada nativa de áudio e streaming UDP — dB Studio

## Decisão principal

A próxima etapa não deve começar pelo UDP. Deve começar por um **núcleo de áudio nativo determinístico**, com relógio, buffers, DSP e métricas bem definidos. O transporte de rede deve consumir e produzir blocos PCM por meio de filas sem bloqueio. Isso evita que jitter de Wi‑Fi, alocação de memória ou reconexão contaminem o callback de áudio.

Minha recomendação é usar **C++ no núcleo compartilhado**, com uma camada fina de bindings para desktop e mobile. Essa escolha reduz atrito com ASIO, Core Audio, Audio Units e Oboe. Rust também é viável e oferece boas garantias de memória, mas exigirá mais integração FFI justamente nas áreas em que os SDKs de áudio já são C/C++.

O MVP web já implementado deve permanecer como console de controle. A camada nativa deve ser um processo/biblioteca separado, com uma API de estado que a UI possa consultar e comandar. Não se deve colocar DSP ou recebimento UDP dentro do processo React/Electron.

## Arquitetura proposta

Organize o código em cinco camadas:

1. `audio-core`: tipos PCM, relógio monotônico de áudio, ring buffers, mixer, pan, EQ, compressor, reverb, delay, limiter, medidores e crossfade.
2. `audio-host`: adapters para Windows/ASIO, macOS/Core Audio, iOS/AVAudioSession + Audio Unit e Android/Oboe/AAudio.
3. `transport`: descoberta, sessão, RTP/RTCP ou protocolo equivalente, jitter buffer, reordenação, perda, reconexão e métricas.
4. `control-plane`: autenticação, permissões, snapshots, comandos de mixer, WebSocket/TCP/TLS e sincronização de estado.
5. `bindings`: API C estável ou C ABI para desktop e módulos nativos para React Native/Flutter, mantendo a UI fora do callback de áudio.

A Apple descreve Core Audio como a infraestrutura de áudio de baixa latência de iOS e macOS, com HAL no macOS e Audio Units para processamento e I/O. No Windows, ASIO é o caminho profissional para comunicação de baixa latência com interfaces; no macOS não é necessário ASIO porque Core Audio ocupa esse papel. [Core Audio — Apple](https://developer.apple.com/library/archive/documentation/MusicAudio/Conceptual/CoreAudioOverview/WhatisCoreAudio/WhatisCoreAudio.html) [ASIO — Steinberg](https://helpcenter.steinberg.de/hc/en-us/articles/17863730844946-Steinberg-built-in-ASIO-Driver-information-download)

## Fase 0 — fechar as metas de produto

Antes do código nativo, fixe métricas que possam ser medidas:

- sample rate inicial: 48 kHz;
- formato interno: float32 não intercalado ou intercalado, escolhido uma vez e documentado;
- entrada do servidor: 16-bit/24-bit convertido para o formato interno;
- saída para o telefone: PCM estéreo 16-bit na primeira versão;
- alvo de latência servidor → fone: mediana abaixo de 25 ms em rede dedicada;
- limite operacional: p95 abaixo de 40 ms, sem estalos audíveis;
- perda tolerável: definir política explícita, por exemplo ocultar perdas isoladas com PLC/silêncio curto e declarar falha quando houver sequência prolongada;
- número de clientes: 16 simultâneos no teste de referência;
- comportamento após queda: reconectar sem clique e com fade-in seguro.

A documentação do Android alerta que latência varia muito por modelo e build, que não se deve assumir que clocks de entrada e saída estejam sincronizados e que até dois endpoints nominalmente em 48 kHz podem ter taxas reais ligeiramente diferentes. Isso significa que o motor precisa de medição e ajuste de taxa, não apenas de uma configuração fixa. [Android — Audio latency](https://developer.android.com/ndk/guides/audio/audio-latency)

## Fase 1 — núcleo de áudio offline

Implemente primeiro um host de arquivo/teste, sem placa de som e sem rede. O núcleo deve:

- processar blocos de 48, 96, 128 ou 256 frames;
- misturar entradas em até 16 buses estéreo;
- aplicar volume, pan e mute por músico;
- executar EQ paramétrico de 4 bandas, compressor, reverb, delay e limiter;
- fazer crossfade ao trocar snapshot ou reconectar;
- produzir medidores RMS/peak e redução de ganho;
- detectar clipping e xrun;
- executar A/B e reset sem alocação no callback;
- ter testes determinísticos com sinais senoidais, impulso, silêncio e ruído.

Regra do callback: não fazer `malloc`, lock, I/O de disco, log textual, DNS, criptografia pesada ou chamadas de UI. O callback deve ler de uma fila pré-alocada, processar o bloco e escrever na saída. Comandos entram por uma fila de mensagens versionadas e são aplicados em limites de bloco.

A primeira evidência dessa fase deve ser um teste que compara a saída do DSP com arquivos de referência e um teste de estresse que processa 16 mixagens por vários minutos sem xrun.

## Fase 2 — hosts nativos de áudio

### Windows

Criar um adapter ASIO com enumeração de dispositivos, abertura de input, callback de buffer, sample rate, buffer size e tratamento de reset/dispositivo desconectado. Priorize o driver nativo do fabricante. O driver ASIO integrado da Steinberg é útil como fallback, mas a própria documentação recomenda normalmente o driver mais recente do fabricante da interface. [Steinberg — ASIO Driver](https://helpcenter.steinberg.de/hc/en-us/articles/17863730844946-Steinberg-built-in-ASIO-Driver-information-download)

Antes de distribuir um binário com ASIO, revisar juridicamente a variante do SDK escolhida. A Steinberg mantém informações de licenciamento dos SDKs e há alternativas de licença que podem impor obrigações incompatíveis com um produto proprietário. [Steinberg — SDK licensing](https://www.steinberg.net/developers/prorietary-sdk/) [Steinberg — ASIO open-source variant](https://www.steinberg.net/developers/asiosdk-open/)

### macOS

Usar Core Audio/HAL para listar devices, streams, sample rate, buffer frame size e callbacks de render. Implementar notificações para device add/remove, mudança de sample rate e mudança de buffer. Depois, conectar o host à cadeia de DSP por ring buffers.

### iOS

Usar `AVAudioSession` para declarar a categoria e ativar a sessão. A categoria e a ativação são responsabilidade do sistema, então o app precisa tratar interrupções, mudança de rota, lock de tela, headset conectado/desconectado e chamadas. Para operação com a tela bloqueada, habilitar o Background Mode de áudio e testar o ciclo completo; a Apple documenta que essa capability é necessária para continuar playback em background. [AVAudioSession — Apple](https://developer.apple.com/documentation/avfaudio/avaudiosession) [Background media playback — Apple](https://developer.apple.com/documentation/avfoundation/configuring-your-app-for-media-playback)

O caminho de saída deve priorizar fone com fio ou interface USB-C. Bluetooth deve ser tratado como modo não profissional, porque acrescenta buffers e comportamento de rota que não são compatíveis com a meta de previsibilidade de um IEM.

### Android

Usar Oboe como camada C++ principal. Oboe escolhe AAudio em APIs mais novas e OpenSL ES em versões antigas, além de oferecer ajustes de latência e workarounds para dispositivos. [Oboe — Google](https://github.com/google/oboe)

Em AAudio, solicitar `LOW_LATENCY`, usar data callback de alta prioridade, verificar a configuração efetivamente concedida e reagir a desconexões em outra thread. A documentação informa que modo exclusivo pode reduzir latência, mas aumenta a chance de falha quando outro app já usa o dispositivo; portanto, implementar fallback para shared mode. [AAudio — Android NDK](https://developer.android.com/ndk/guides/audio/aaudio/aaudio)

Não hardcode o buffer do Android. Descubra sample rate e frames por buffer quando possível, faça a saída ser múltipla do burst reportado e exponha no diagnóstico se o aparelho possui `audio.low_latency` e `audio.pro`. [Android — Audio latency](https://developer.android.com/ndk/guides/audio/audio-latency) Para Android 17 ou superior, planeje um foreground service de reprodução iniciado enquanto o app está visível; a plataforma passou a endurecer o uso de áudio em background e pode silenciar chamadas inválidas sem lançar exceção. [Android — background audio hardening](https://developer.android.com/about/versions/17/changes/bg-audio)

## Fase 3 — protocolo de áudio

Eu não usaria “UDP cru” sem semântica de mídia. Usaria RTP sobre UDP, ou um cabeçalho próprio claramente inspirado em RTP, com RTCP para telemetria. RTP já define sequence number para detectar perdas, timestamp baseado no instante de amostragem e SSRC para identificar a fonte. RTCP fornece perda acumulada, maior sequence number recebido, jitter e estimativa de round trip. [RFC 3550](https://www.rfc-editor.org/rfc/rfc3550)

Um pacote inicial poderia conter:

```text
magic/version       2 bytes
session_id          8 bytes
stream_id           2 bytes
sequence            2 bytes
sample_timestamp    4 bytes
sample_rate         4 bytes
frames_per_packet   2 bytes
channels            1 byte
format              1 byte
flags               2 bytes
payload             N bytes
authentication tag   variável
```

Para interoperabilidade futura, use payload type dinâmico e sinalize sample rate, canais e encoding no estabelecimento da sessão; o RFC 3551 reserva 96–127 para mapeamento dinâmico e recomenda não inventar mapeamentos estáticos proprietários. [RFC 3551](https://www.rfc-editor.org/rfc/rfc3551)

Para 48 kHz, 16-bit, estéreo, cada cliente consome 1,536 Mbps de PCM bruto. Dezesseis clientes somam 24,576 Mbps antes de cabeçalhos, retransmissões, controle e overhead Wi‑Fi. A banda nominal não é o maior risco; o risco é airtime, interferência, retransmissão no enlace sem fio, jitter e comportamento do sistema operacional.

No receptor, implemente nesta ordem:

1. validar autenticação e versão;
2. rejeitar replay e pacotes fora da janela;
3. ordenar por sequence;
4. converter timestamp em posição no relógio de reprodução;
5. preencher o jitter buffer;
6. ocultar perda isolada com repetição/interpolação/silêncio curto;
7. ajustar a profundidade do buffer conforme jitter observado;
8. aplicar drift correction por resampling muito lento, sem alterar pitch de forma audível;
9. entregar blocos ao callback nativo;
10. reportar perda, jitter, buffer, underrun e latência ao control-plane.

Para segurança, preferir SRTP ou uma construção equivalente com confidencialidade, autenticação e proteção contra replay. Criptografar somente o WebSocket de controle não protege o áudio. O RFC 3711 descreve SRTP justamente para esses três requisitos e ressalta que criptografia sem autenticação não é suficiente. [RFC 3711](https://www.rfc-editor.org/rfc/rfc3711)

## Fase 4 — descoberta e controle

Separe áudio e controle:

- UDP/RTP para PCM e RTCP;
- TLS/WebSocket ou TCP para login local, snapshots, faders, permissões, mensagens e diagnóstico;
- QR code contendo servidor, porta, session ID e token de curta duração;
- descoberta por Bonjour/mDNS no Apple e um mecanismo equivalente no desktop/Android;
- IP manual como fallback;
- heartbeat e lease de dispositivo;
- estado autoritativo no servidor;
- comandos idempotentes com `revision` para evitar que um telefone antigo sobrescreva uma mixagem nova.

A Apple Network framework oferece UDP, TCP, TLS, QUIC, browser de serviços e monitoramento de caminho em iOS 12+, macOS 10.14+ e outras plataformas Apple. Ela pode ser usada para descoberta e controle; o áudio ainda deve respeitar o caminho de tempo real separado do controle. [Network framework — Apple](https://developer.apple.com/documentation/network)

## Fase 5 — integração com o dB Studio existente

A integração com o MVP deve acontecer por contratos, não por acoplamento visual. Adicione ao backend/tRPC ou a um daemon local uma API como:

- `audio.devices.list`
- `audio.device.open`
- `audio.device.close`
- `audio.engine.start`
- `audio.engine.stop`
- `audio.metrics.subscribe`
- `mix.snapshot.apply`
- `mix.channel.update`
- `device.invite`
- `device.revoke`
- `session.exportReport`

O frontend deve continuar recebendo estado agregado: `sampleRate`, `bufferFrames`, `xruns`, `inputPeak`, `outputPeak`, `packetLoss`, `jitterMs`, `playoutBufferMs`, `roundTripMs`, `deviceRoute` e `engineState`. O frontend nunca deve assumir que “48 kHz” significa que o hardware concedeu exatamente 48 kHz; ele deve mostrar o valor efetivamente aberto pelo host.

## Fase 6 — laboratório de rede e testes de show

Construa um test harness que injete atraso, jitter, perda, duplicação, reordenação e queda de interface. Teste pelo menos:

- perda aleatória de 0,1%, 1% e 5%;
- bursts de perda de 50–500 ms;
- jitter de 1, 5, 15 e 30 ms;
- roaming ou troca de AP;
- servidor conectado por Ethernet e por Wi‑Fi, sendo o primeiro obrigatório para operação;
- 1, 4, 8 e 16 clientes simultâneos;
- troca de sample rate e reconexão do USB;
- lock de tela, chamada recebida, headset conectado e troca de rota no iOS;
- desconexão/reconexão do Android e mudanças de foreground/background;
- mute, snapshot e troca de preset durante áudio contínuo;
- falha de autenticação e replay de pacote.

Meça latência ponta a ponta com um sinal elétrico ou loopback, não apenas com timestamps do software. Para Android, a própria documentação recomenda medir o caminho real e alerta que não há uma API universal que retorne a latência de qualquer rota. [Android — Measuring latency](https://developer.android.com/ndk/guides/audio/audio-latency)

## Critério de go/no-go

Eu não liberaria isso como substituto geral de bodypacks apenas porque “funciona no Wi‑Fi do escritório”. O produto deve passar em uma rede dedicada, com o computador no Ethernet, fones com fio, AP conhecido, 16 clientes e teste de movimento. Se houver p95 acima de 40 ms, bursts audíveis, reconexão com clique ou comportamento inconsistente por modelo de telefone, o sistema deve ser apresentado como ferramenta de ensaio/monitoramento pessoal e não como substituto universal de IEM profissional.

Essa é a visão crítica mais importante: Wi‑Fi compartilhado e smartphones têm variabilidade de rádio, sistema operacional, rota de áudio e bateria. Para uma primeira entrega comercial, eu posicionaria o dB Studio em três modos: **ensaio**, **palco controlado** e **monitoramento auxiliar**. Um modo “show crítico” só deveria ser liberado depois dos testes acima. O caminho mais seguro para reduzir risco é manter o áudio principal com fio no telefone e deixar Bluetooth explicitamente fora do caminho profissional.

## Ordem prática de execução

1. Fixar metas de latência, buffer, perda e compatibilidade.
2. Criar `audio-core` e testes offline.
3. Entregar host Windows ASIO e macOS Core Audio.
4. Entregar receptor Android Oboe e iOS Audio Session/Audio Unit.
5. Implementar RTP/RTCP, jitter buffer e métricas com áudio sintético.
6. Adicionar SRTP, tokens e replay protection.
7. Integrar descoberta, controle e snapshots.
8. Executar laboratório com perda/jitter e 16 clientes.
9. Integrar os diagnósticos reais ao dashboard existente.
10. Só então iniciar piloto de ensaio com uma banda e uma rede dedicada.

## Evidência já implementada

O transporte `DBAU/1` já possui uma primeira camada de proteção operacional: validação de magic/version, criação de sessão no HELLO, controle do maior sequence por cliente, rejeição de replay e reordenação, contadores de pacotes inválidos/descartados e contagem de pacotes de áudio sintético aceitos. O E2E `pnpm test:e2e:control` comprova esse comportamento com o mesmo socket UDP: um pacote de áudio é aceito, dois são descartados por sequência e um pacote com versão inválida é rejeitado.

Isso ainda não é um jitter buffer nem segurança de produção. Permanecem pendentes autenticação de sessão, proteção contra replay criptográfica, RTP/RTCP ou cabeçalho equivalente completo, fila sem lock, DSP e entrega ao callback nativo.
