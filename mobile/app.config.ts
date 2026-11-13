import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "dB Studio",
  slug: "dbstudio-mobile",
  version: "0.1.0",
  orientation: "portrait",
  userInterfaceStyle: "dark",
  scheme: "dbstudio",
  newArchEnabled: true,
  ios: {
    bundleIdentifier: "com.dbstudio.mobile",
    supportsTablet: true,
    infoPlist: {
      NSLocalNetworkUsageDescription:
        "O dB Studio precisa encontrar o servidor de áudio na rede local.",
      UIBackgroundModes: ["audio"],
    },
  },
  android: {
    package: "com.dbstudio.mobile",
    adaptiveIcon: {
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
      backgroundColor: "#0b1215",
    },
    permissions: [
      "ACCESS_NETWORK_STATE",
      "ACCESS_WIFI_STATE",
      "INTERNET",
      "FOREGROUND_SERVICE",
      "FOREGROUND_SERVICE_MEDIA_PLAYBACK",
    ],
  },
  icon: "./assets/images/icon.png",
  splash: {
    image: "./assets/images/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#0b1215",
  },
  web: {
    favicon: "./assets/images/favicon.png",
    bundler: "metro",
  },
};

export default config;
