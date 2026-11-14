## Vertical 3 — shells nativos

A estrutura nativa agora está separada em `src-tauri/` e `mobile/`. O shell Tauri 2 reutiliza `dist/public`, preserva o Express como plano de controle e expõe um comando Rust de diagnóstico. O app Expo/React Native possui entrypoint próprio, configuração Android/iOS, ícones, permissões de rede local e tela do músico conectada à telemetria do servidor.

O Sandbox confirmou o typecheck web e mobile e o export web do Expo. A compilação do Tauri, APK/AAB e IPA/TestFlight permanece dependente de Rust/toolchain de plataforma, Android SDK/EAS ou macOS/Xcode e credenciais de assinatura. O áudio PCM nativo ainda é uma etapa separada.
