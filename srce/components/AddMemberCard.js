import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

const AddMemberCard = ({ onPress }) => {
  return (
    <TouchableOpacity
      style={styles.addMemberRow}
      onPress={onPress}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <View style={styles.avatarSmall}>
        <Icon name="plus" size={14} color="#5fc9c9" />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  addMemberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  avatarSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addText: {
    fontSize: 16,
    color: '#5A67D8',
    fontWeight: '500',
  },
});

export default AddMemberCard;
