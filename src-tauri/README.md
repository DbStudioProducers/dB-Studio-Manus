# dB Studio Desktop — Tauri

Shell nativo desktop para o console do servidor dB Studio. O frontend é o build existente em `dist/public`; o processo Express continua sendo a fonte dos endpoints `/api/health` e `/api/udp/status`.

## Desenvolvimento

Na raiz do projeto:

```bash
pnpm build
cargo tauri dev
```

## Release

```bash
pnpm build
cargo tauri build
```

O bundle produz formatos conforme o host e os targets configurados. Windows exige toolchain Windows/MSVC; macOS exige macOS/Xcode; Linux exige Rust e dependências GTK/WebKit.

No Sandbox atual, `cargo` e `rustc` não estão instalados. A estrutura foi criada e validada estaticamente, mas nenhum instalador Tauri deve ser considerado gerado até executar `cargo tauri build` em um host compatível.

O comando Rust `desktop_status` apenas expõe o estado do shell. Ele não implementa captura ASIO/Core Audio: essa integração permanece no `audio-core/audio-host` planejado.
