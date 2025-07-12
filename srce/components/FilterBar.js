// components/FilterBar.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

const FilterBar = ({ filters, selectedFilters, onSelectFilter }) => {
    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.container}
        >
            {filters.map(filter => {
                const isSelected = selectedFilters.includes(filter.value);
                return (
                    <TouchableOpacity
                        key={filter.value}
                        style={[
                            styles.filterChip,
                            isSelected && styles.selectedChip
                        ]}
                        onPress={() => onSelectFilter(filter.value)}
                    >
                        <Text style={[styles.chipText, isSelected && styles.selectedText]}>
                            {filter.label}
                        </Text>
                        {isSelected && <Icon name="check" size={12} color="#fff" style={styles.icon} />}
                    </TouchableOpacity>
                );
            })}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 2,
        paddingVertical: 8,
        flexDirection: 'row',
    },
    filterChip: {
        backgroundColor: '#E0F7F9',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        marginRight: 4,
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'center',       // ensure it doesn't stretch inside parent
        height: 24,                // explicitly cap height
    },
    chipText: {
        fontSize: 14,
        lineHeight: 14,
        color: '#333',
    },
    icon: {
        marginLeft: 4,
        marginTop: 1,              // optional tweak to vertically align
    },

    selectedChip: {
    backgroundColor: '#5FC9C9',
    },

    selectedText: {
        color: '#fff',
        fontWeight: 'bold',
    }
});

export default FilterBar;