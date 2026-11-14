# Resultado da compilação nativa na VM

## Ambiente

A compilação foi executada em Ubuntu 24.04.5 LTS `aarch64`, com 6 vCPUs, aproximadamente 23 GB de RAM e 38 GB livres. Node.js 22.23.4, pnpm 10.18.0, Java 21 e Rust 1.100.0 foram usados.

## Desktop Linux ARM64

O ambiente recebeu as dependências WebKitGTK do Tauri, Rust via rustup e `tauri-cli 2.12.4`. A compilação foi concluída depois de corrigir o script `scripts/build_native.sh`, que usava `--manifest-path` na posição incompatível com a CLI atual, e o shell Tauri, cujo payload `DesktopStatus` precisava implementar `Clone`.

Artefatos gerados:

- `src-tauri/target/release/bundle/deb/dB Studio_0.1.0_arm64.deb`
- `src-tauri/target/release/bundle/rpm/dB Studio-0.1.0-1.aarch64.rpm`
- `src-tauri/target/release/bundle/appimage/dB Studio_0.1.0_aarch64.AppImage`

O binário é Linux ARM64. Ele não é instalador Windows `.msi` nem macOS `.dmg`.

## Android

O Android SDK oficial foi instalado em `/home/ubuntu/android-sdk` com Platform 35, Build Tools 35.0.0, NDK 27.1.12297006 e CMake 3.22.1. O projeto nativo foi gerado com `expo prebuild --platform android`.

O APK não foi gerado porque a VM é ARM64 e os executáveis oficiais baixados pelo SDK, incluindo `aapt2` e `adb`, são `x86_64`. O Gradle chegou ao build do projeto, mas o daemon AAPT2 não iniciou; o bundler Hermes também reportou que o host Linux ARM64 não é reconhecido para o compilador embutido.

Para gerar o APK, use um runner Linux x86_64, Windows x64 ou macOS compatível, com o mesmo SDK/NDK, ou um serviço EAS Build. O `adb` Debian ARM64 instalado separadamente não resolve a incompatibilidade dos Build Tools oficiais usados pelo Gradle.

## Validações

- `pnpm check`: aprovado.
- `pnpm test`: 14 testes aprovados.
- `pnpm native:build:desktop`: aprovado para Linux ARM64.
- `pnpm --dir mobile typecheck`: aprovado antes do prebuild.
- `pnpm --dir mobile exec expo prebuild --platform android`: aprovado.
- `./gradlew assembleRelease`: bloqueado por AAPT2/Hermes x86_64 em host ARM64.

## Próximo ambiente recomendado

Para Android, use um runner `linux/x64` com labels `self-hosted, linux, x64, android, oboe-audio`, como já declarado em `.github/workflows/native-hardware.yml`. Para Windows Tauri/ASIO use `windows/x64`; para iOS e Core Audio use macOS. A VM ARM64 é adequada para o bundle Linux ARM64 e para validação de Rust, mas não para o APK Android oficial nesta configuração.
