import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Modal,
} from 'react-native';

import Icon from 'react-native-vector-icons/FontAwesome';
import { useUser } from '../components/context/UserContext';


export default function GroupListModal({
  isVisible = false,
  groups = [],
  selectedGroupId = null,
  onClose,
  onSelect,
}) {
  const { accessToken } = useUser();

  const safeClose = onClose ?? (() => {});
  const safeSelect = onSelect ?? (() => {});

  if (!accessToken) {
    return null;
  }

  /*
   * "Alle Todos" ist bewusst Teil derselben Auswahl
   * wie die einzelnen Gruppen.
   *
   * groupId = null bedeutet:
   * kein Gruppenfilter.
   */
  const listData = [
    {
      groupId: null,
      groupName: 'Alle Todos',
      isAllTodosOption: true,
    },
    ...groups,
  ];


  const handleSelect = (groupId) => {
    safeSelect(groupId);
    safeClose();
  };


  return (
    <Modal
      visible={!!isVisible}
      transparent
      animationType="fade"
      onRequestClose={safeClose}
    >
      <View style={styles.overlay}>

        {/* Backdrop */}
        <TouchableWithoutFeedback
          onPress={safeClose}
          accessible={false}
        >
          <View style={StyleSheet.absoluteFillObject} />
        </TouchableWithoutFeedback>


        {/* Modal */}
        <View style={styles.modalContent}>

          <Text style={styles.modalTitle}>
            Todos filtern
          </Text>

          <Text style={styles.modalSubtitle}>
            Alle anzeigen oder nach Gruppe filtern
          </Text>


          <FlatList
            data={listData}

            keyExtractor={(item) =>
              item.isAllTodosOption
                ? 'all-todos'
                : String(item.groupId)
            }

            contentContainerStyle={styles.listContainer}

            ItemSeparatorComponent={() => (
              <View style={styles.separator} />
            )}

            renderItem={({ item }) => {
              const isSelected =
                item.isAllTodosOption
                  ? selectedGroupId == null
                  : selectedGroupId === item.groupId;

              /*
               * Spezialoption "Alle Todos"
               */
              if (item.isAllTodosOption) {
                return (
                  <TouchableOpacity
                    style={[
                      styles.groupItem,
                      isSelected && styles.selectedGroupItem,
                    ]}
                    onPress={() => handleSelect(null)}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.avatar,
                        styles.allTodosAvatar,
                      ]}
                    >
                      <Icon
                        name="list"
                        size={17}
                        color="#4FB6B8"
                      />
                    </View>


                    <View style={styles.groupInfo}>
                      <Text style={styles.groupName}>
                        Alle Todos
                      </Text>

                      <Text style={styles.allTodosDescription}>
                        Gruppen- und Nachbarschafts-Todos
                      </Text>
                    </View>


                    {isSelected && (
                      <Icon
                        name="check"
                        size={16}
                        color="#4FB6B8"
                      />
                    )}
                  </TouchableOpacity>
                );
              }


              /*
               * Normale Gruppe
               */
              return (
                <TouchableOpacity
                  style={[
                    styles.groupItem,
                    isSelected && styles.selectedGroupItem,
                  ]}
                  onPress={() =>
                    handleSelect(item.groupId)
                  }
                  activeOpacity={0.8}
                >
                  <View style={styles.avatar}>
                    <Text style={styles.avatarInitial}>
                      {item.groupName
                        ?.charAt(0)
                        ?.toUpperCase() ?? '?'}
                    </Text>
                  </View>


                  <View style={styles.groupInfo}>
                    <Text style={styles.groupName}>
                      {item.groupName}
                    </Text>

                    <View style={styles.roleRow}>
                      {item.role === 'ADMIN' && (
                        <Icon
                          name="shield"
                          size={12}
                          color="#FFD700"
                          style={styles.roleIcon}
                        />
                      )}

                      <Text style={styles.roleText}>
                        {item.role === 'ADMIN'
                          ? 'Admin'
                          : 'Member'}
                      </Text>
                    </View>
                  </View>


                  {isSelected && (
                    <Icon
                      name="check"
                      size={16}
                      color="#4FB6B8"
                    />
                  )}
                </TouchableOpacity>
              );
            }}
          />


          {groups.length === 0 && (
            <View style={styles.emptyHint}>
              <Text style={styles.emptyText}>
                Du bist derzeit in keiner Gruppe.
                Deine öffentlichen Todos werden trotzdem
                unter „Alle Todos“ angezeigt.
              </Text>
            </View>
          )}

        </View>

      </View>
    </Modal>
  );
}


const styles = StyleSheet.create({

  overlay: {
    flex: 1,
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    maxHeight: '70%',
    width: '100%',
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    color: '#333',
  },

  modalSubtitle: {
    fontSize: 13,
    color: '#777',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 14,
  },

  listContainer: {
    paddingBottom: 4,
  },

  separator: {
    height: 1,
    backgroundColor: '#ECECEC',
    marginHorizontal: 8,
  },

  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 60,
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 10,
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

  allTodosAvatar: {
    backgroundColor: '#E6F4F4',
  },

  avatarInitial: {
    fontSize: 16,
    fontWeight: '700',
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

  allTodosDescription: {
    fontSize: 12,
    color: '#777',
    marginTop: 2,
  },

  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },

  roleIcon: {
    marginRight: 5,
  },

  roleText: {
    fontSize: 13,
    color: '#666',
  },

  emptyHint: {
    paddingTop: 14,
    paddingHorizontal: 8,
  },

  emptyText: {
    fontSize: 13,
    color: '#777',
    textAlign: 'center',
    lineHeight: 19,
  },

});