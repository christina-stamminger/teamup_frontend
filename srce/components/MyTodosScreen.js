import React, { useState} from 'react';
import { View, Text, TouchableOpacity, Alert, FlatList, StyleSheet } from 'react-native';
import CollapsibleTodoCard from '../components/CollapsibleTodoCard';

const todos = [
  { id: '1', username: 'Alice', description: 'Bring coffee beans to office', date: '2025-01-30', priority: 'High', status: 'In Progress' },
  { id: '2', username: 'Bob', description: 'Pick up order from pharmacy', date: '2025-01-30', priority: 'Medium', status: 'Pending' },
];

export default function MyTodosScreen() {
  return (
    <View style={styles.container}>
      <FlatList
        data={todos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <CollapsibleTodoCard todo={item} />}
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
