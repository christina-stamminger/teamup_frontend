import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, Alert, Text } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import CollapsibleTodoCard from '../components/CollapsibleTodoCard';
import { useIsFocused } from '@react-navigation/native';

export default function OpenTodosScreen() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused(); // triggers fetchTodo everytime the screen is navigated to

  const handleLocalTodoUpdate = (todoId) => {
    // Entferne das Todo direkt aus der Liste
    setTodos((prevTodos) => prevTodos.filter((t) => t.todoId !== todoId));

    // Optional: Backend nach kurzer Zeit erneut abfragen (z. B. falls sich andere Todos geändert haben)
    setTimeout(() => fetchTodos(), 2000);
  };


  const fetchTodos = async () => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (!token) {
        Alert.alert('Nicht eingeloggt', 'Bitte logge dich ein.');
        setLoading(false);
        return;
      }

      const response = await fetch('http://192.168.50.116:8082/api/todo/group', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("fetched todos:", data)
      setTodos(data);
    } catch (error) {
      console.error('Fehler beim Laden der Todos:', error);
      Alert.alert('Fehler', 'Todos konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      fetchTodos();
    }
  }, [isFocused]);

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
      </View>
      <Text style={styles.headerTitle}>Open Todos</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#888" />
      ) : (
        <FlatList
          data={todos}
          keyExtractor={(item) => item.todoId.toString()}
          renderItem={({ item }) => (
            <CollapsibleTodoCard
              todo={item}
              onStatusUpdated={() => handleLocalTodoUpdate(item.todoId)}
            />
          )}
        />

      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    marginTop: 30,
    backgroundColor: '#F7F7F7',
  },
  headerTitle: {
    fontSize: 26, // ⬆️ Increased font size (was 22 before)
    color: '#333',
    textAlign: 'center', // ⬅️ Also helps center text inside its block
  },
});
