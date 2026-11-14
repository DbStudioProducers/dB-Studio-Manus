# Build Android no Codemagic

O repositório agora contém `codemagic.yaml` na raiz. O workflow `dbstudio-android-apk` usa uma máquina Linux x86_64, instala as dependências pnpm do workspace, executa `expo prebuild`, configura o Android SDK e gera `mobile/android/app/build/outputs/apk/release/*.apk`.

Para ativar o workflow:

1. Acesse o Codemagic e adicione uma aplicação a partir do GitHub.
2. Autorize o Codemagic CI/CD GitHub App e conceda acesso ao repositório `DbStudioProducers/dB-Studio-Manus`.
3. Selecione a branch `main` e o workflow `dbstudio-android-apk`.
4. Inicie o build manualmente. Depois, o push na `main` também dispara o workflow conforme a configuração atual.
5. Ao concluir, baixe o APK na seção Artifacts do build.

O workflow produz um APK de teste assinado pela configuração debug gerada pelo Expo. Para distribuição fora de testes, é necessário cadastrar um keystore Android no Codemagic e alterar o `build.gradle` para usar as variáveis `CM_KEYSTORE_PATH`, `CM_KEYSTORE_PASSWORD`, `CM_KEY_ALIAS` e `CM_KEY_PASSWORD`.

A documentação oficial informa que `codemagic.yaml` precisa estar commitado na raiz do repositório e que os artefatos declarados ficam disponíveis para download após o build: <https://docs.codemagic.io/yaml-basic-configuration/yaml-getting-started/>. O fluxo oficial de integração requer autorizar o GitHub App do Codemagic no proprietário ou organização do repositório: <https://docs.codemagic.io/partials/github/>. O guia de React Native/Expo descreve o uso de `expo prebuild`, `local.properties`, Gradle e artefatos Android: <https://docs.codemagic.io/yaml-quick-start/building-a-react-native-app/>.
