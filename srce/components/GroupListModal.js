// GroupListModal.js
import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import Modal from 'react-native-modal';
import Icon from 'react-native-vector-icons/FontAwesome';

export default function GroupListModal({ isVisible, groups, selectedGroupId, onClose, onSelect }) {
  return (
    <Modal isVisible={isVisible} onBackdropPress={onClose}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Select a Group</Text>

        <FlatList
          data={groups}
          keyExtractor={(item, index) => item?.groupId ? item.groupId.toString() : index.toString()}
          contentContainerStyle={styles.listContainer}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.groupItem,
                selectedGroupId === item.groupId && styles.selectedGroupItem,
              ]}
              onPress={() => onSelect(item.groupId)}
              activeOpacity={0.8}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarInitial}>
                  {item.groupName.charAt(0).toUpperCase()}
                </Text>
              </View>

              <View style={styles.groupInfo}>
                <Text style={styles.groupName}>{item.groupName}</Text>
                
                {/* ✅ Nur Admins sehen das Shield-Icon */}
                <View style={styles.roleRow}>
                  {item.role === 'ADMIN' && (
                    <Icon
                      name="shield"
                      size={12}
                      color="#FFD700"
                      style={styles.icon}
                    />
                  )}
                  <Text style={styles.roleText}>
                    {item.role === 'ADMIN' ? 'Admin' : 'Member'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
    color: '#333',
  },
  listContainer: {
    paddingBottom: 10,
  },
  separator: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 6,
  },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  selectedGroupItem: {
    backgroundColor: '#E0F7FA',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarInitial: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  icon: {
    marginRight: 5,
  },
  roleText: {
    fontSize: 13,
    color: '#666',
  },
});
