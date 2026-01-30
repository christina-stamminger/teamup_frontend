import 'dotenv/config';
/*
const isEasBuild = ['development', 'preview', 'production'].includes(
  process.env.EAS_BUILD_PROFILE
);
*/
export default {
  expo: {
    name: "bringit",
    slug: "bringit",
    version: "1.0.6",    // hier user version hochziehen

    runtimeVersion: {
      policy: "appVersion",
    },

    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,


    updates: {
      url: "https://u.expo.dev/da762c57-1d88-4aba-b0cb-d5c4fb973bdb",
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
      buildNumber: "7",

      runtimeVersion: {
        policy: "appVersion",
      },

      infoPlist: {
        ITSAppUsesNonExemptEncryption: false
      }
    },


    android: {
      package: "com.christina.bringit",
      versionCode: 11,
      softwareKeyboardLayoutMode: "resize",

      runtimeVersion: "1.0.5",

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
          ios: {
            newArchEnabled: true
          },
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
