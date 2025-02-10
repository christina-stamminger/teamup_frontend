import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import CollapsibleTodoCard from '../components/CollapsibleTodoCard';

const openTodos = [
  { id: '3', username: 'Charlie', description: 'Refactor API calls', date: '2025-01-28', priority: 'High', status: 'Open' },
  { id: '4', username: 'Dave', description: 'Design new logo', date: '2025-01-27', priority: 'Low', status: 'Pending' },
];

export default function OpenTodosScreen() {
  return (
    <View style={styles.container}>
      <FlatList
        data={openTodos}
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
