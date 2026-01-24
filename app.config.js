import 'dotenv/config';

const isEasBuild =
  process.env.EAS_BUILD_PROFILE === 'preview' ||
  process.env.EAS_BUILD_PROFILE === 'production';

export default {
  expo: {
    name: "bringit",
    slug: "bringit",
    version: "1.0.1",              // hier user version hochziehen

    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: isEasBuild,

    updates: {
      enabled: false,
      checkAutomatically: "ON_LOAD",
      fallbackToCacheTimeout: 0,
    },

    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },

    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.christina.bringit",
      buildNumber: "2",            // für ios hier erhöhen
    },

    android: {
      package: "com.christina.bringit",
      versionCode: 9,              // schon mehr builds als für ios
      softwareKeyboardLayoutMode: "resize",
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

    extra: {
      API_URL: process.env.API_URL,
      APP_ENV: process.env.APP_ENV,
      eas: {
        projectId: "da762c57-1d88-4aba-b0cb-d5c4fb973bdb"
      }
    }
  }
};
