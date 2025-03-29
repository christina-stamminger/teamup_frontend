import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useUser } from "../components/context/UserContext";


const CollapsibleTodoCard = ({ todo }) => {
  const [isExpanded, setIsExpanded] = useState(false); // Track whether the card is expanded or collapsed
  const { userId, loading } = useUser();  // Extract userId from context
  console.log("Rendering CollapsibleTodoCard with userId:", userId);

  console.log("userid: ", userId)
    // Log the todo object and userId to help with debugging
    console.log("Rendering CollapsibleTodoCard with userId:", userId);
    console.log("todo object:", todo);
    console.log("todo.userOfferedId:", todo?.userOffered); // Log the userOfferedId

  const toggleExpand = () => {
    setIsExpanded(!isExpanded); // Toggle the expanded state
  };
  console.log("userid again:", userId)

    // Ensure that we're not rendering while the userId is still loading
    if (loading) {
      return <Text>Loading...</Text>; // Show loading state until userId is available
    }
  return (
    <TouchableOpacity style={styles.card} onPress={toggleExpand}>
      {/* Title, username, and expiresAt are shown when the card is collapsed */}
      <View style={styles.cardContent}>
        <Text style={styles.title}>{todo.title}</Text>
        <Text style={styles.userId}>
          Issuer: {userId} {userId && userId === todo.userId ? "(You)" : ""}

        </Text>



        <Text style={styles.expiresAt}>Expires at: {todo.expiresAt}</Text>
      </View>

      {/* Show additional info when expanded */}
      {isExpanded && (
        <View style={styles.additionalContent}>
          {/* Description */}
          <Text style={styles.description}>Description: {todo.description}</Text>

          {/* Additional Info */}
          <Text style={styles.addInfo}>Additional Info: {todo.addInfo}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  cardContent: {
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  username: {
    fontSize: 14,
    color: '#555',
    marginVertical: 5,
  },
  expiresAt: {
    fontSize: 14,
    color: '#777',
    marginBottom: 5,
  },
  additionalContent: {
    marginTop: 10,
  },
  description: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
  },
  addInfo: {
    fontSize: 14,
    color: '#777',
    marginBottom: 5,
  },
});

export default CollapsibleTodoCard;
