import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

export default function ViewModeToggle({ mode, onChange }) {
  return (
    <View style={styles.container}>
      <Chip label="Karte" active={mode === 'map'} onPress={() => onChange('map')} />
      <Chip label="Liste" active={mode === 'list'} onPress={() => onChange('list')} />
    </View>
  );
}

function Chip({ label, active, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.chip, active && styles.chipActive]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 12,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 20,
    backgroundColor: '#eee',
  },
  chipActive: {
    backgroundColor: '#4FB6B8',
  },
  chipText: {
    color: '#555',
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#fff',
  },
});