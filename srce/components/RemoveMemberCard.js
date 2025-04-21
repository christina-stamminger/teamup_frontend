import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

const RemoveMemberCard = ({ onPress }) => {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Icon name="user-times" size={24} color="#fff" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 5,
    backgroundColor: '#FF5C5C',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10, // spacing from AddMemberCard
  },
});

export default RemoveMemberCard;
