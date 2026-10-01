import "dotenv/config";

const appVariant = process.env.APP_VARIANT;
const appEnv = process.env.APP_ENV;
const apiUrl = process.env.API_URL;
const mapboxPublicToken = process.env.MAPBOX_PUBLIC_TOKEN;

if (!appVariant) {
  throw new Error("APP_VARIANT is missing");
}

if (!appEnv) {
  throw new Error("APP_ENV is missing");
}

if (!apiUrl) {
  throw new Error("API_URL is missing");
}

if (!mapboxPublicToken) {
  throw new Error("MAPBOX_PUBLIC_TOKEN is missing");
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
    name: getAppName(),
    slug: "bringit",
    version: "1.0.22",

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
      backgroundColor: "#ffffff",
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: getBundleIdentifier(),
      buildNumber: "23",
      associatedDomains: [
        "webcredentials:api.bringit.tech"
      ],
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      package: getBundleIdentifier(),
      versionCode: 22,
      softwareKeyboardLayoutMode: "resize",
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    plugins: [
      "expo-secure-store",
      "expo-notifications",

      [
        "expo-build-properties",
        {
          ios: {
            newArchEnabled: true,
          },
          android: {
            enableProguardInReleaseBuilds: true,
          },
        },
      ],
      "@rnmapbox/maps",
      [
        "expo-location",
        {
          locationWhenInUsePermission:
            "bringit nutzt deinen Standort, um Nachbarschaftshilfe in deiner Nähe zu zeigen.",
        },
      ],
    ],
    scheme: "bringit",
    platforms: ["ios", "android", "web"],
    extra: {
      API_URL: apiUrl,
      APP_ENV: appEnv,
      APP_VARIANT: appVariant,
      // Public Token, im Client-Code ueber expo-constants auslesbar
      MAPBOX_PUBLIC_TOKEN: mapboxPublicToken,
      eas: {
        projectId: "da762c57-1d88-4aba-b0cb-d5c4fb973bdb",
      },
    },
  },
};