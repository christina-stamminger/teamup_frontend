import Constants from 'expo-constants';

export const API_URL = Constants.expoConfig?.extra?.API_URL;
export const APP_ENV = Constants.expoConfig?.extra?.APP_ENV;

if (!API_URL) {
  console.warn('❌ API_URL is undefined – check app.config.js');
}