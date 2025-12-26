import 'dotenv/config';

export default {
  expo: {
    name: "bringit",
    slug: "bringit",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: false,

    updates: {
      enabled: true,
      checkAutomatically: "ON_LOAD",
      fallbackToCacheTimeout: 0,
    },

    runtimeVersion: {
      policy: "sdkVersion",
    },

    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },

    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.christina.bringit",
      buildNumber: "1.0.0"
    },

    android: {
      package: "com.christina.bringit",
      versionCode: 2,
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      }
    },

    web: {
      favicon: "./assets/favicon.png"
    },

    plugins: [
      "expo-secure-store",
      [
        "expo-build-properties",
        {
          android: {
            enableProguardInReleaseBuilds: true
          }
        }
      ]
    ],

    scheme: "bringit",
    platforms: ["ios", "android", "web"],

    // 🔥 ENV richtig definiert
    extra: {
      API_URL: process.env.API_URL,
      APP_ENV: process.env.APP_ENV,
      eas: {
        projectId: "da762c57-1d88-4aba-b0cb-d5c4fb973bdb"
      }
    }
  }
};
