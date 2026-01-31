import React from 'react';
import { View, Text, FlatList, TouchableOpacity, TouchableWithoutFeedback, StyleSheet } from 'react-native';
import { Modal } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useUser } from '../components/context/UserContext';

export default function GroupListModal({
  isVisible = false,
  groups = [],
  selectedGroupId,
  onClose,
  onSelect,
}) {
  const { accessToken } = useUser();

  // 🟢 Defensive callbacks – NIE undefined
  const safeClose = onClose ?? (() => { });
  const safeSelect = onSelect ?? (() => { });

  // 🟢 Modal niemals rendern, wenn ausgeloggt
  if (!accessToken) {
    return null;
  }

  return (
    <Modal
      visible={!!isVisible}
      transparent
      animationType="fade"
      onRequestClose={safeClose} // Android Back
    >
      <View style={styles.overlay}>

        {/* 👇 1️⃣ BACKDROP – schließt Modal */}
        <TouchableWithoutFeedback onPress={safeClose} accessible={false}>
          <View style={StyleSheet.absoluteFillObject} />
        </TouchableWithoutFeedback>

        {/* 👇 2️⃣ MODAL CONTENT – bleibt offen */}
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Wähle eine Gruppe</Text>

          {groups.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                Erstelle zuerst eine Gruppe in{" "}
                <Text style={styles.highlight}>Meine Gruppen</Text>.
              </Text>
            </View>
          ) : (
            <FlatList
              data={groups}
              keyExtractor={(item) => String(item.groupId)}
              contentContainerStyle={styles.listContainer}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.groupItem,
                    selectedGroupId === item.groupId && styles.selectedGroupItem,
                  ]}
                  onPress={() => {
                    safeSelect(item.groupId); // ✅ Gruppe setzen
                    safeClose();              // ✅ Modal schließen
                  }}
                  activeOpacity={0.8}
                >
                  <View style={styles.avatar}>
                    <Text style={styles.avatarInitial}>
                      {item.groupName?.charAt(0)?.toUpperCase() ?? "?"}
                    </Text>
                  </View>

                  <View style={styles.groupInfo}>
                    <Text style={styles.groupName}>{item.groupName}</Text>

                    <View style={styles.roleRow}>
                      {item.role === "ADMIN" && (
                        <Icon name="shield" size={12} color="#FFD700" />
                      )}
                      <Text style={styles.roleText}>
                        {item.role === "ADMIN" ? "Admin" : "Member"}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </View>

      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    maxHeight: '70%',
    width: '90%',
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
    backgroundColor: '#E6F4F4',
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
  overlay: {
    flex: 1,
    width: "100%",
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    paddingVertical: 30,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
  },

  highlight: {
    fontWeight: "700",
    color: "#333",
  },

});
