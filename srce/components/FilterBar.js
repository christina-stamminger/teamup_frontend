import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";

const FilterBar = ({ filters, selectedFilters, onSelectFilter }) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {filters.map((filter) => {
        const isSelected = selectedFilters.includes(filter.value);
        return (
          <TouchableOpacity
            key={filter.value}
            activeOpacity={0.75}
            style={[styles.chip, isSelected && styles.chipActive]}
            onPress={() => onSelectFilter(filter.value)}
          >
            <Text
              style={[styles.chipText, isSelected && styles.chipTextActive]}
              numberOfLines={1}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingLeft: 0,
    paddingRight: 24,
    paddingVertical: 12,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EDEEF1",
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: "#E7F6F6",
    borderColor: "#CDEBEA",
  },
  chipText: {
    fontSize: 13.5,
    fontWeight: "600",
    color: "#6B7280",
  },
  chipTextActive: {
    color: "#2B8A8C",
    fontWeight: "700",
  },
});

export default FilterBar;