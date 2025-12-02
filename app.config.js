export default {
  expo: {
    name: "bringit",
    slug: "bringit",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
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
      versionCode: 1,
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

    // ⬇️ **HIER EINSETZEN**
    extra: {
      eas: {
        projectId: "da762c57-1d88-4aba-b0cb-d5c4fb973bdb"
      }
    }
  }
};
