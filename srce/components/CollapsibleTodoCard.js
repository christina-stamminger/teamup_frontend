import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Collapsible from 'react-native-collapsible';
import { Card } from 'react-native-paper';

// This collapsible TodoCard will be used in MyTodos and OpenTodos
const CollapsibleTodoCard = ({ todo }) => {
  const [collapsed, setCollapsed] = useState(true);

  return (
    <Card style={styles.card}>
      <TouchableOpacity onPress={() => setCollapsed(!collapsed)}>
        <Card.Title title={todo.username} subtitle={todo.date} />
      </TouchableOpacity>

      <Collapsible collapsed={collapsed}>
        <Card.Content>
          <Text style={styles.description}>{todo.description}</Text>
          <Text style={styles.details}>Priority: {todo.priority}</Text>
          <Text style={styles.details}>Status: {todo.status}</Text>
        </Card.Content>
      </Collapsible>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 4,
    padding: 12,
  },
  description: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  details: {
    fontSize: 14,
    color: '#6B7280',
  },
});

export default CollapsibleTodoCard;
