import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, Alert, Text } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import CollapsibleTodoCard from '../components/CollapsibleTodoCard';
import { useIsFocused } from '@react-navigation/native';

export default function OpenTodosScreen() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused(); // triggers fetchTodo everytime the screen is navigated to

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
          renderItem={({ item }) => <CollapsibleTodoCard todo={item} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    //marginTop: 30,
    backgroundColor: '#F7F7F7',
  },
  headerTitle: {
    fontSize: 26, // ⬆️ Increased font size (was 22 before)
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center', // ⬅️ Also helps center text inside its block
  },
});
