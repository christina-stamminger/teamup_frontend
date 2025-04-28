import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, PanResponder } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const TodoItem = ({ todo, onDelete }) => {
  const [swiped, setSwiped] = useState(new Animated.Value(0));

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (e, gestureState) => {
      return Math.abs(gestureState.dx) > 10; // Start gesture if moved horizontally
    },
    onPanResponderMove: (e, gestureState) => {
      if (gestureState.dx > 0) { // Swipe right
        Animated.spring(swiped, {
          toValue: gestureState.dx, // Move swipe distance
          useNativeDriver: false,
        }).start();
      }
    },
    onPanResponderRelease: (e, gestureState) => {
      if (gestureState.dx > 150) { // If swiped enough, trigger delete
        onDelete();
      } else {
        // Reset if not swiped far enough
        Animated.spring(swiped, {
          toValue: 0,
          useNativeDriver: false,
        }).start();
      }
    },
  });

  return (
    <Animated.View
      style={[styles.card, { transform: [{ translateX: swiped }] }]}
      {...panResponder.panHandlers}
    >
      <View style={styles.cardContent}>
        <Text style={styles.title}>{todo.title}</Text>
        <Text style={styles.description}>{todo.description}</Text>
      </View>
      <Animated.View style={[styles.deleteButton, { opacity: swiped.interpolate({
          inputRange: [100, 150],
          outputRange: [0, 1],
        })}]}>
        <TouchableOpacity onPress={onDelete} style={styles.deleteButtonContent}>
          <MaterialIcons name="delete" size={24} color="white" />
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    padding: 15,
    marginVertical: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  cardContent: {
    flex: 1,
    paddingRight: 30, // Make space for delete button
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 14,
    color: '#777',
  },
  deleteButton: {
    position: 'absolute',
    top: '50%',
    right: 0,
    backgroundColor: '#E74C3C',
    width: 80,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    transform: [{ translateY: -30 }],
  },
  deleteButtonContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default TodoItem;
