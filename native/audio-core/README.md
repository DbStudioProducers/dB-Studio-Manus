# audio-core

Este diretório contém o núcleo C++ portátil do dB Studio. `StereoMixEngine` recebe blocos PCM intercalados, aplica gain, pan, mute e master, e produz saída estéreo com métricas RMS/peak e contador de xrun.

A função `process` foi desenhada para o callback de áudio: não aloca memória, não adquire locks, não faz I/O e não chama a UI. A configuração acontece fora do callback.

O smoke test é executado por:

```bash
pnpm native:test:audio-core
```

O núcleo não acessa hardware diretamente. Os hosts ASIO, Core Audio, Oboe/AAudio e Audio Unit devem conectar seus callbacks ao núcleo por buffers pré-alocados e reportar sample rate, buffer concedido, xrun e rota efetiva.
