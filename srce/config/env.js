import Constants from 'expo-constants';

export const API_URL = Constants.expoConfig?.extra?.API_URL;
export const APP_ENV = Constants.expoConfig?.extra?.APP_ENV;

if (!API_URL) {
  throw new Error("API_URL missing – app cannot start");
}
