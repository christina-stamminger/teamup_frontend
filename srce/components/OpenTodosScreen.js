import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import ViewModeToggle from '../components/todos/ViewModeToggle';
import TodoListView from '../components/todos/TodoListView';
import TodoMapView from '../components/todos/TodoMapView';
import { getStoredViewMode, setStoredViewMode } from '../utils/viewModePreference';

export default function OpenTodosScreen() {
  const [mode, setMode] = useState('map'); // Default beim allerersten Start
  const [preferenceLoaded, setPreferenceLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const stored = await getStoredViewMode();
      if (stored) {
        setMode(stored);
      }
      setPreferenceLoaded(true);
    })();
  }, []);

  const handleModeChange = (newMode) => {
    setMode(newMode);
    setStoredViewMode(newMode);
  };

  // Kurzer leerer Render bis die Praeferenz geladen ist, damit die
  // Karte nicht erst kurz aufblitzt und dann auf Liste umspringt
  if (!preferenceLoaded) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Offene Todos</Text>
      <ViewModeToggle mode={mode} onChange={handleModeChange} />
      <View style={styles.content}>
        {mode === 'map' ? <TodoMapView /> : <TodoListView />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 30,
    backgroundColor: '#F7F7F7',
  },
  headerTitle: {
    fontSize: 26,
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
});