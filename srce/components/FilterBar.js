// components/FilterBar.js
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
            activeOpacity={0.7}
            style={styles.filterButton}
            onPress={() => onSelectFilter(filter.value)}
          >
            <Text
              style={[
                styles.filterText,
                isSelected && styles.filterTextActive,
              ]}
            >
              {filter.label}
            </Text>

            {isSelected && <View style={styles.activeUnderline} />}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  filterButton: {
    marginRight: 18,
    alignItems: "center",
  },
  filterText: {
    fontSize: 15,
    color: "#777", // neutral gray
    fontWeight: "500",
  },
  filterTextActive: {
    color: "#4FB6B8",
    fontWeight: "700",
  },
  activeUnderline: {
    marginTop: 4,
    height: 2,
    width: "60%",
    backgroundColor: "#4FB6B8",
    borderRadius: 2,
  },
});

export default FilterBar;
