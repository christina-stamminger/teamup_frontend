import "dotenv/config";

const appVariant = process.env.APP_VARIANT;
const appEnv = process.env.APP_ENV;
const apiUrl = process.env.API_URL;

if (!appVariant) {
  throw new Error("APP_VARIANT is missing");
}

if (!appEnv) {
  throw new Error("APP_ENV is missing");
}

if (!apiUrl) {
  throw new Error("API_URL is missing");
}

const getAppName = () => {
  if (appVariant === "development") return "bringit Dev";
  if (appVariant === "preview") return "bringit Preview";
  return "bringit";
};

const getBundleIdentifier = () => {
  if (appVariant === "development") return "com.christina.bringit.dev";
  if (appVariant === "preview") return "com.christina.bringit.preview";
  return "com.christina.bringit";
};

export default {
    expo: {
        name: "bringit",
        slug: "bringit",
        version: "1.0.17",    // hier user version hochziehen
        cli: {
            appVersionSource: "local"
        },

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
            buildNumber: "17",   // hier user build number erhöhen

            infoPlist: {
                ITSAppUsesNonExemptEncryption: false
            }
        },


        android: {
            package: "com.christina.bringit",
            versionCode: 17,   // hier user version code erhöhen
            softwareKeyboardLayoutMode: "resize",

            adaptiveIcon: {
                foregroundImage: "./assets/adaptive-icon.png",
                backgroundColor: "#ffffff"
            },
          
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