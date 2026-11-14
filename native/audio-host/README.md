# Audio hosts nativos

O contrato `audio_host.hpp` separa o callback de áudio do restante do aplicativo. O núcleo `native/audio-core` processa blocos PCM sem alocação, lock, I/O ou chamadas de UI no callback.

Os adapters são compilados condicionalmente:

| Backend             | Arquivo              | Macro                        | SDK/host necessário                        |
| ------------------- | -------------------- | ---------------------------- | ------------------------------------------ |
| Windows ASIO        | `asio_host.cpp`      | `DBSTUDIO_ENABLE_ASIO`       | Windows + ASIO SDK do fabricante/Steinberg |
| macOS Core Audio    | `core_audio_host.mm` | `DBSTUDIO_ENABLE_CORE_AUDIO` | macOS + Core Audio/HAL                     |
| Android Oboe/AAudio | `oboe_host.cpp`      | `DBSTUDIO_ENABLE_OBOE`       | Android NDK + Oboe                         |
| iOS Audio Unit      | `audio_unit_host.mm` | `DBSTUDIO_ENABLE_AUDIO_UNIT` | macOS/Xcode + AudioToolbox/AVAudioSession  |

No Linux/Sandbox, `portable_host.cpp` funciona como fallback explícito e não promete dispositivo de baixa latência. O smoke test local verifica mixer, gain, pan, mute, métricas e xrun:

```bash
pnpm native:test:audio-core
```

A presença do header do SDK não significa que o driver esteja pronto para palco. Cada adapter ainda precisa abrir o dispositivo, consultar sample rate/buffer concedidos, instalar o callback, reagir a disconnect/xrun e ligar o callback ao ring buffer do `audio-core`. A validação final deve ser feita nos runners nativos com hardware real.
