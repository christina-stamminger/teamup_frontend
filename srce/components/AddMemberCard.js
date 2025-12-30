import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

const AddMemberCard = ({ onPress }) => {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={12}
      style={({ pressed }) => [
        styles.pressArea,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel="Mitglied hinzufügen"
    >
      <View style={styles.avatarSmall}>
        <Icon name="plus" size={14} color="#5fc9c9" />
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  addText: {
    fontSize: 16,
    color: '#5A67D8',
    fontWeight: '500',
  },
  pressArea: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
  avatarSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AddMemberCard;
