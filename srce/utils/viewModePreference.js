import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'openTodosViewMode';

export async function getStoredViewMode() {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEY);
    return value === 'list' || value === 'map' ? value : null;
  } catch (err) {
    console.warn('Konnte View-Mode nicht laden:', err);
    return null;
  }
}

export async function setStoredViewMode(mode) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, mode);
  } catch (err) {
    console.warn('Konnte View-Mode nicht speichern:', err);
  }
}