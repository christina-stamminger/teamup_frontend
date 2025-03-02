import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, FlatList, StyleSheet } from 'react-native';
import * as SecureStore from 'expo-secure-store';  // Secure store for fetching the token
import CollapsibleTodoCard from '../components/CollapsibleTodoCard';  // Assuming this is your card component
import { useUser } from "../components/context/UserContext"; // Import the useUser hook for userID, create context to make it globally accessible

export default function MyTodosScreen() {
  const [todos, setTodos] = useState([]);  // State to store fetched todos
  const [loading, setLoading] = useState(true);  // Loading state to show while fetching
  const { userId } = useUser(); // Get userId from context
  

  // Fetch todos when the component mounts
  useEffect(() => {
    const fetchTodos = async () => {
      try {
        const token = await SecureStore.getItemAsync('authToken');
        
        // Fetch from API 
        const response = await fetch(`http://192.168.50.116:8082/api/todo/offeredByUser/${userId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch todos');
        }

        const data = await response.json();
        setTodos(data);  // Set the fetched todos into state
      } catch (error) {
        console.error('Error fetching todos:', error);
        Alert.alert('Error', 'Failed to fetch todos. Please try again.');
      } finally {
        setLoading(false);  // Set loading to false after the fetch completes
      }
    };

    fetchTodos();
  }, [userId]);  // Dependency array includes userId to re-fetch if it changes

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={todos}  // Pass the fetched todos to the FlatList
        keyExtractor={(item) => item.id}  // Use the ID of each todo as the key
        renderItem={({ item }) => <CollapsibleTodoCard todo={item} />}  // Render each todo using your card component
      />
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
});
