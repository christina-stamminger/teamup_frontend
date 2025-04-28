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
                <View style={styles.roleRow}>
                  <Icon
                    name={item.role === 'ADMIN' ? 'shield' : 'user'}
                    size={12}
                    color={item.role === 'ADMIN' ? '#FFD700' : '#5A67D8'}
                    style={styles.icon}
                  />
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
    backgroundColor: '#fff',
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  listContainer: {
    paddingBottom: 20,
  },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#F9F9F9',
  },
  selectedGroupItem: {
    backgroundColor: '#DFF6F6',
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: '700',
    color: '#555',
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  roleText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  icon: {
    marginTop: 1,
  },
  separator: {
    height: 12,
  },
});
