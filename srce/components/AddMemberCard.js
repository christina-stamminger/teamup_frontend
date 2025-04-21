import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

const AddMemberCard = ({ onPress }) => {
  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.cardButton} onPress={onPress}>
        <Icon name="user-plus" size={24} color="#FFFFFF" style={styles.plusIcon} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginTop: 12,
    width: 40, // Set a specific width for the card
    height: 40, // Set a specific height for the card
    backgroundColor: '#5FC9C9', // The same color as the group button
    borderRadius: 5, // Rounded corners for the card
    alignItems: 'center', // Centers the content horizontally
    justifyContent: 'center', // Centers the content vertically
    alignSelf: 'center', // Ensures the card is centered within its parent container
  },
  cardButton: {
    width: '100%',
    height: '100%',
    justifyContent: 'center', // Centers the icon vertically
    alignItems: 'center', // Centers the icon horizontally
    borderRadius: 10,  // Round corners
  },
  plusIcon: {
    // No need for marginTop, as it's already centered
  },
});

export default AddMemberCard;
