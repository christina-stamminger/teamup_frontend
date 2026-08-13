import Constants from "expo-constants";

export const API_URL = Constants.expoConfig?.extra?.API_URL;
export const APP_ENV = Constants.expoConfig?.extra?.APP_ENV;

export const MAPBOX_PUBLIC_TOKEN =
  Constants.expoConfig?.extra?.MAPBOX_PUBLIC_TOKEN;

// ❗ KEIN throw beim App-Start
if (!API_URL) {
  console.warn("⚠️ API_URL is missing", {
    extra: Constants.expoConfig?.extra,
  });
}

if (!MAPBOX_PUBLIC_TOKEN) {
  console.warn("⚠️ MAPBOX_PUBLIC_TOKEN is missing");
}