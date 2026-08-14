import React, { useRef, useState, useEffect } from "react";

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from "react-native";

import { Swipeable } from "react-native-gesture-handler";
import { MaterialIcons } from "@expo/vector-icons";
import { Feather } from "@expo/vector-icons";
import Icon from "react-native-vector-icons/FontAwesome";
import * as SecureStore from "expo-secure-store";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import Toast from "react-native-toast-message";

import { useUser } from "../components/context/UserContext";
import { useNetwork } from "../components/context/NetworkContext";

import { getStatusColor } from "../utils/statusHelpers";
import { API_URL } from "../config/env";
import TodoFulfillmentAddress from "./TodoFulfillmentAddress";


const CANCEL_REASONS = [
  {
    value: "NO_LONGER_AVAILABLE",
    label: "Ich kann das Todo doch nicht erledigen",
  },
  {
    value: "TIME_CONFLICT",
    label: "Zeitlich geht es sich nicht mehr aus",
  },
  {
    value: "TASK_UNCLEAR",
    label: "Der Auftrag ist für mich nicht klar",
  },
  {
    value: "SAFETY_CONCERN",
    label: "Ich habe Sicherheitsbedenken",
  },
  {
    value: "OTHER",
    label: "Sonstiger Grund",
  },
];


const CollapsibleTodoCard = ({
  todo,
  onStatusUpdated,
  onDelete,
  hasUnread,
  forceExpanded = false,
}) => {

  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {

    if (forceExpanded) {
      setIsExpanded(true);
    }

  }, [forceExpanded]);

  const [isCancelModalVisible, setIsCancelModalVisible] =
    useState(false);

  const [isCancelling, setIsCancelling] =
    useState(false);

  const [isUpdatingStatus, setIsUpdatingStatus] =
    useState(false);


  const {
    userId,
    loading,
    accessToken,
    setBringits,
  } = useUser();

  const {
    safeFetch,
    shouldShowError,
  } = useNetwork();


  const isFocused = useIsFocused();

  const swipeableRef = useRef(null);

  const navigation = useNavigation();

  const statusColor =
    getStatusColor(todo.status);


  // =========================================================
  // PERMISSIONS / UI STATE
  // =========================================================

  const isParticipant =
    !!todo.userTakenId &&
    [
      todo.userOfferedId,
      todo.userTakenId,
    ].includes(userId);


  const canOpenChat =
    isParticipant &&
    [
      "IN_ARBEIT",
      "ERLEDIGT",
      "ABGELAUFEN",
    ].includes(todo.status);


  const isCurrentFulfiller =
    todo.userTakenId === userId;

  const canSeeFulfillmentDetails =
    todo.status === "IN_ARBEIT" &&
    (
      todo.userOfferedId === userId ||
      todo.userTakenId === userId
    );


  const toggleExpand = () => {
    setIsExpanded(previous => !previous);
  };


  // =========================================================
  // AUTH
  // =========================================================

  const getAuthToken = async () => {

    if (accessToken) {
      return accessToken;
    }

    return await SecureStore.getItemAsync(
      "accessToken"
    );
  };


  // =========================================================
  // STATUS
  //
  // Nur:
  // OFFEN -> IN_ARBEIT
  // IN_ARBEIT -> ERLEDIGT
  //
  // Abbrechen läuft separat über /cancel.
  // =========================================================

  const updateTodoStatus = async (
    newStatus
  ) => {

    if (
      newStatus !== "IN_ARBEIT" &&
      newStatus !== "ERLEDIGT"
    ) {
      console.warn(
        "Unsupported status transition in frontend:",
        newStatus
      );

      return;
    }

    try {

      setIsUpdatingStatus(true);

      const token =
        await getAuthToken();


      if (!token) {

        Toast.show({
          type: "error",
          text1: "Nicht angemeldet",
          text2:
            "Bitte melde dich erneut an.",
        });

        return;
      }


      const response =
        await safeFetch(
          `${API_URL}/api/todo/status`,
          {
            method: "PATCH",

            headers: {
              Authorization:
                `Bearer ${token}`,

              "Content-Type":
                "application/json",
            },

            /*
             * userTakenId wird bewusst NICHT
             * mehr vom Client geschickt.
             */
            body: JSON.stringify({
              todoId: todo.todoId,
              status: newStatus,
            }),
          }
        );


      if (response?.offline) {

        Toast.show({
          type: "info",
          text1: "Offline",
          text2:
            "Keine Internetverbindung",
        });

        return;
      }


      if (!response) {

        throw new Error(
          "No response received"
        );
      }


      let result = {};

      try {
        result =
          await response.json();
      } catch {
        result = {};
      }


      if (!response.ok) {

        /*
         * Typischer Race-Condition-Fall:
         *
         * Während dieses Gerät das Todo noch als OFFEN
         * angezeigt hat, hat ein anderer User es bereits
         * übernommen.
         *
         * Das Backend ist die Source of Truth.
         * Deshalb lokalen Stand sofort aktualisieren.
         */
        if (
          newStatus === "IN_ARBEIT" &&
          response.status === 409
        ) {

          setIsExpanded(false);

          Toast.show({
            type: "info",
            text1: "Todo bereits vergeben",
            text2:
              "Dieses Todo wurde gerade von jemand anderem übernommen.",
            visibilityTime: 2500,
          });

          /*
           * Parent neu laden:
           * z.B. /mine, offene Todos etc.
           */
          await onStatusUpdated?.();

          return;
        }


        /*
         * Andere Backend-Fehler normal anzeigen.
         */
        Toast.show({
          type: "error",

          text1:
            result.errorMessage ||
            result.message ||
            "Todo konnte nicht aktualisiert werden.",

          visibilityTime: 2500,
        });

        return;
      }


      /*
       * BringIts aus Backend übernehmen.
       */
      if (
        typeof result.bringIts ===
        "number"
      ) {
        setBringits(
          result.bringIts
        );
      }


      Toast.show({
        type: "success",

        text1:
          newStatus === "IN_ARBEIT"
            ? "Todo übernommen"
            : "Todo erledigt",

        visibilityTime: 1500,
      });


      /*
       * Parent lädt /api/todo/mine neu.
       */
      await onStatusUpdated?.();


    } catch (error) {

      console.error(
        "Fehler beim Aktualisieren des Todo-Status:",
        error
      );


      if (shouldShowError()) {

        Toast.show({
          type: "error",
          text1:
            "Todo konnte nicht aktualisiert werden.",
          visibilityTime: 2000,
        });
      }

    } finally {

      setIsUpdatingStatus(false);

    }
  };


  // =========================================================
  // CANCEL
  //
  // PATCH /api/todo/{id}/cancel
  //
  // Body:
  // {
  //   reason: "TIME_CONFLICT"
  // }
  // =========================================================

  const cancelTodo = async (
    reason
  ) => {

    if (!reason) {
      return;
    }


    try {

      setIsCancelling(true);

      const token =
        await getAuthToken();


      if (!token) {

        Toast.show({
          type: "error",
          text1: "Nicht angemeldet",
          text2:
            "Bitte melde dich erneut an.",
        });

        return;
      }


      const response =
        await safeFetch(
          `${API_URL}/api/todo/${todo.todoId}/cancel`,
          {
            method: "PATCH",

            headers: {
              Authorization:
                `Bearer ${token}`,

              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              reason,
            }),
          }
        );


      if (response?.offline) {

        Toast.show({
          type: "info",
          text1: "Offline",
          text2:
            "Keine Internetverbindung",
        });

        return;
      }


      if (!response) {

        throw new Error(
          "No response received"
        );
      }


      let result = {};

      try {
        result =
          await response.json();
      } catch {
        result = {};
      }


      if (!response.ok) {

        Toast.show({
          type: "error",

          text1:
            result.errorMessage ||
            result.message ||
            "Todo konnte nicht abgebrochen werden.",

          visibilityTime: 2500,
        });

        return;
      }


      if (
        typeof result.bringIts ===
        "number"
      ) {
        setBringits(
          result.bringIts
        );
      }


      /*
       * Modal erst nach erfolgreichem
       * Backend-Update schließen.
       */
      setIsCancelModalVisible(
        false
      );


      Toast.show({
        type: "success",
        text1: "Todo wieder freigegeben",
        text2:
          "Das Todo ist jetzt wieder offen.",
        visibilityTime: 2000,
      });


      /*
       * /mine neu laden.
       */
      await onStatusUpdated?.();


    } catch (error) {

      console.error(
        "Fehler beim Abbrechen des Todos:",
        error
      );


      if (shouldShowError()) {

        Toast.show({
          type: "error",
          text1:
            "Todo konnte nicht abgebrochen werden.",
          visibilityTime: 2000,
        });
      }

    } finally {

      setIsCancelling(false);

    }
  };


  // =========================================================
  // DELETE / TRASH
  // =========================================================

  const deleteTodo = async () => {

    if (
      (todo.status || "")
        .toUpperCase() ===
      "IN_ARBEIT"
    ) {

      Toast.show({
        type: "error",
        text1:
          "Todos in Arbeit können nicht gelöscht werden.",
        visibilityTime: 2000,
      });

      swipeableRef.current
        ?.close();

      return;
    }


    try {

      const token =
        await getAuthToken();


      if (!token) {

        Toast.show({
          type: "error",
          text1: "Nicht angemeldet",
        });

        return;
      }


      const response =
        await safeFetch(
          `${API_URL}/api/todo/${todo.todoId}/trash`,
          {
            method: "PUT",

            headers: {
              Authorization:
                `Bearer ${token}`,

              "Content-Type":
                "application/json",
            },
          }
        );


      if (response?.offline) {

        Toast.show({
          type: "info",
          text1: "Offline",
          text2:
            "Keine Internetverbindung",
        });

        return;
      }


      if (!response) {

        throw new Error(
          "No response received"
        );
      }


      let result = {};

      try {
        result =
          await response.json();
      } catch {
        result = {};
      }


      if (!response.ok) {

        Toast.show({
          type: "error",

          text1:
            result.errorMessage ||
            "Todo konnte nicht gelöscht werden.",

          visibilityTime: 2000,
        });

        return;
      }


      Toast.show({
        type: "success",
        text1:
          "Todo in Papierkorb verschoben.",
        visibilityTime: 1500,
      });


      onDelete?.(
        todo.todoId
      );


      if (isFocused) {
        onStatusUpdated?.();
      }


      swipeableRef.current
        ?.close();


    } catch (error) {

      console.error(
        "Fehler beim Löschen:",
        error
      );


      Toast.show({
        type: "error",
        text1: "Netzwerkfehler.",
        visibilityTime: 2000,
      });
    }
  };


  const renderRightActions =
    () => (

      <View
        style={
          styles.deleteButton
        }
      >

        <TouchableOpacity
          onPress={
            deleteTodo
          }
          style={
            styles.deleteButtonContent
          }
        >

          <MaterialIcons
            name="delete"
            size={24}
            color="white"
          />

        </TouchableOpacity>

      </View>
    );


  // =========================================================
  // LOADING USER CONTEXT
  // =========================================================

  if (loading) {

    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          color="#4FB6B8"
        />
      </View>
    );
  }


  // =========================================================
  // RENDER
  // =========================================================

  return (
    <>

      <Swipeable
        key={
          `${todo.todoId}-${todo.status}`
        }
        enabled={
          !isExpanded
        }
        renderRightActions={
          renderRightActions
        }
        ref={
          swipeableRef
        }
      >

        <View
          style={[
            styles.card,
            todo.isTimeCritical &&
            styles.timeCriticalCard,
          ]}
        >

          {/* HEADER */}

          <TouchableOpacity
            onPress={
              toggleExpand
            }
            activeOpacity={0.85}
          >

            {/* STATUS */}

            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    statusColor,
                },
              ]}
            >

              <Text
                style={
                  styles.statusBadgeText
                }
              >
                {todo.status}
              </Text>

            </View>


            {/* GROUP */}

            {todo.groupName && (

              <Text
                style={
                  styles.groupName
                }
              >
                {todo.groupName}
              </Text>

            )}


            {/* TITLE */}

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
              }}
            >

              <Text
                style={
                  styles.title
                }
              >
                {todo.title}
              </Text>


              {hasUnread && (

                <View
                  style={
                    styles.unreadDot
                  }
                />

              )}

            </View>


            {/* USERS */}

            <View
              style={
                styles.userBlock
              }
            >

              <View
                style={
                  styles.userRow
                }
              >

                <Icon
                  name="user"
                  size={16}
                  color="#666"
                  style={
                    styles.icon
                  }
                />

                <Text
                  style={
                    styles.userValue
                  }
                >

                  {todo.username}

                  {userId ===
                    todo.userOfferedId
                    ? " (Du)"
                    : ""}

                </Text>

              </View>


              {todo.userTakenUsername && (

                <View
                  style={
                    styles.userRow
                  }
                >

                  <Icon
                    name="check"
                    size={16}
                    color="#28a745"
                    style={
                      styles.icon
                    }
                  />

                  <Text
                    style={
                      styles.userValue
                    }
                  >

                    {
                      todo.userTakenUsername
                    }

                    {userId ===
                      todo.userTakenId
                      ? " (Du)"
                      : ""}

                  </Text>

                </View>

              )}

            </View>

          </TouchableOpacity>


          {/* BODY */}

          {isExpanded && (

            <View
              style={
                styles.additionalContent
              }
            >

              {/* DESCRIPTION */}

              {todo.description && (

                <View
                  style={
                    styles.detailRow
                  }
                >

                  <Feather
                    name="file-text"
                    size={18}
                    color="#4B5563"
                    style={
                      styles.icon
                    }
                  />

                  <Text
                    style={
                      styles.detailText
                    }
                  >
                    {todo.description}
                  </Text>

                </View>

              )}

              <TodoFulfillmentAddress
                todoId={todo.todoId}
                canSee={canSeeFulfillmentDetails}
              />


              {!todo.userTakenId && (

                <Text
                  style={
                    styles.userTakenText
                  }
                >
                  Dieses Todo wurde noch nicht übernommen.
                </Text>

              )}


              {/* TIME CRITICAL */}

              {todo.isTimeCritical && (

                <View
                  style={
                    styles.timeCriticalWarning
                  }
                >

                  <Icon
                    name="exclamation-triangle"
                    size={16}
                    color="#FF6B6B"
                    style={{
                      marginRight: 8,
                    }}
                  />

                  <Text
                    style={
                      styles.timeCriticalWarningText
                    }
                  >
                    Zeitkritisch: Nach Ablauf automatisch abgelaufen
                  </Text>

                </View>

              )}


              {/* TIME */}

              <View
                style={
                  styles.timeContainer
                }
              >

                <View
                  style={
                    styles.timeBlock
                  }
                >

                  <View
                    style={
                      styles.timeHeader
                    }
                  >

                    <Icon
                      name="clock-o"
                      size={14}
                      color={
                        statusColor
                      }
                      style={{
                        marginRight: 6,
                      }}
                    />

                    <Text
                      style={[
                        styles.timeLabel,
                        {
                          color:
                            statusColor,
                        },
                      ]}
                    >
                      Läuft ab:
                    </Text>

                  </View>


                  <Text
                    style={[
                      styles.timeMain,
                      {
                        color:
                          statusColor,
                      },
                    ]}
                  >

                    {new Date(
                      todo.expiresAt
                    ).toLocaleTimeString(
                      "de-DE",
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}

                  </Text>


                  <Text
                    style={
                      styles.timeSub
                    }
                  >

                    {new Date(
                      todo.expiresAt
                    ).toLocaleDateString(
                      "de-DE",
                      {
                        weekday: "short",
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      }
                    )}

                  </Text>

                </View>


                {todo.completedAt && (

                  <View
                    style={[
                      styles.timeBlock,
                      styles.completedTimeBlock,
                    ]}
                  >

                    <View
                      style={
                        styles.timeHeader
                      }
                    >

                      <Icon
                        name="check"
                        size={14}
                        color="#4CAF50"
                        style={{
                          marginRight: 6,
                        }}
                      />

                      <Text
                        style={[
                          styles.timeLabel,
                          {
                            color:
                              "#4CAF50",
                          },
                        ]}
                      >
                        Erledigt
                      </Text>

                    </View>


                    <Text
                      style={[
                        styles.timeMain,
                        {
                          color:
                            "#4CAF50",
                        },
                      ]}
                    >

                      {new Date(
                        todo.completedAt
                      ).toLocaleTimeString(
                        "de-DE",
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}

                    </Text>


                    <Text
                      style={
                        styles.timeSub
                      }
                    >

                      {new Date(
                        todo.completedAt
                      ).toLocaleDateString(
                        "de-DE",
                        {
                          weekday: "short",
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        }
                      )}

                    </Text>

                  </View>

                )}

              </View>


              {/* TAKE */}

              {todo.status === "OFFEN" &&
                todo.userOfferedId !==
                userId && (

                  <TouchableOpacity
                    style={[
                      styles.takeButton,
                      isUpdatingStatus &&
                      styles.disabledButton,
                    ]}
                    disabled={
                      isUpdatingStatus
                    }
                    onPress={() =>
                      updateTodoStatus(
                        "IN_ARBEIT"
                      )
                    }
                  >

                    {isUpdatingStatus ? (

                      <ActivityIndicator
                        color="#fff"
                      />

                    ) : (

                      <Text
                        style={
                          styles.takeButtonText
                        }
                      >
                        Ich mach's
                      </Text>

                    )}

                  </TouchableOpacity>

                )}


              {/* FULFILLER ACTIONS */}

              {isCurrentFulfiller &&
                todo.status ===
                "IN_ARBEIT" && (

                  <View
                    style={
                      styles.actionButtons
                    }
                  >

                    {/* COMPLETE */}

                    <TouchableOpacity
                      style={[
                        styles.statusButton,
                        styles.completeButton,
                        isUpdatingStatus &&
                        styles.disabledButton,
                      ]}
                      disabled={
                        isUpdatingStatus ||
                        isCancelling
                      }
                      onPress={() =>
                        updateTodoStatus(
                          "ERLEDIGT"
                        )
                      }
                    >

                      {isUpdatingStatus ? (

                        <ActivityIndicator
                          color="#fff"
                        />

                      ) : (
                        <>

                          <Icon
                            name="check"
                            size={16}
                            color="#fff"
                            style={
                              styles.buttonIcon
                            }
                          />

                          <Text
                            style={
                              styles.statusButtonText
                            }
                          >
                            Erledigt
                          </Text>

                        </>
                      )}

                    </TouchableOpacity>


                    {/* CANCEL */}

                    <TouchableOpacity
                      style={[
                        styles.statusButton,
                        styles.cancelButton,
                      ]}
                      disabled={
                        isUpdatingStatus ||
                        isCancelling
                      }
                      onPress={() =>
                        setIsCancelModalVisible(
                          true
                        )
                      }
                    >

                      <Icon
                        name="times"
                        size={16}
                        color="#555"
                        style={
                          styles.buttonIcon
                        }
                      />

                      <Text
                        style={
                          styles.cancelButtonText
                        }
                      >
                        Abbrechen
                      </Text>

                    </TouchableOpacity>

                  </View>

                )}


              {/* CHAT */}

              {canOpenChat && (

                <TouchableOpacity
                  style={
                    styles.chatTrigger
                  }
                  onPress={() =>
                    navigation.navigate(
                      "TodoChat",
                      { todo }
                    )
                  }
                  activeOpacity={0.85}
                >

                  <Feather
                    name="message-circle"
                    size={18}
                    color="#374151"
                  />

                  <Text
                    style={
                      styles.chatTriggerText
                    }
                  >
                    {todo.status ===
                      "IN_ARBEIT"
                      ? "Kurze Rückfrage"
                      : "Chat ansehen"}
                  </Text>

                </TouchableOpacity>

              )}

            </View>

          )}

        </View>

      </Swipeable>


      {/* =====================================================
          CANCEL MODAL
          ===================================================== */}

      <Modal
        visible={
          isCancelModalVisible
        }
        transparent
        animationType="fade"
        onRequestClose={() => {

          if (!isCancelling) {
            setIsCancelModalVisible(
              false
            );
          }

        }}
      >

        <View
          style={
            styles.modalOverlay
          }
        >

          <TouchableWithoutFeedback
            onPress={() => {

              if (!isCancelling) {
                setIsCancelModalVisible(
                  false
                );
              }

            }}
          >
            <View
              style={
                StyleSheet.absoluteFillObject
              }
            />
          </TouchableWithoutFeedback>


          <View
            style={
              styles.cancelModal
            }
          >

            <Text
              style={
                styles.cancelModalTitle
              }
            >
              Todo abbrechen?
            </Text>


            <Text
              style={
                styles.cancelModalSubtitle
              }
            >
              Bitte wähle einen Grund. Das Todo wird danach wieder für andere freigegeben.
            </Text>


            {CANCEL_REASONS.map(
              reason => (

                <TouchableOpacity
                  key={
                    reason.value
                  }
                  style={
                    styles.cancelReasonItem
                  }
                  disabled={
                    isCancelling
                  }
                  onPress={() =>
                    cancelTodo(
                      reason.value
                    )
                  }
                >

                  <Text
                    style={
                      styles.cancelReasonText
                    }
                  >
                    {reason.label}
                  </Text>


                  <Icon
                    name="chevron-right"
                    size={12}
                    color="#999"
                  />

                </TouchableOpacity>

              )
            )}


            {isCancelling && (

              <View
                style={
                  styles.cancelLoading
                }
              >

                <ActivityIndicator
                  color="#4FB6B8"
                />

                <Text
                  style={
                    styles.cancelLoadingText
                  }
                >
                  Todo wird freigegeben...
                </Text>

              </View>

            )}


            <TouchableOpacity
              style={
                styles.keepTodoButton
              }
              disabled={
                isCancelling
              }
              onPress={() =>
                setIsCancelModalVisible(
                  false
                )
              }
            >

              <Text
                style={
                  styles.keepTodoButtonText
                }
              >
                Doch nicht abbrechen
              </Text>

            </TouchableOpacity>

          </View>

        </View>

      </Modal>

    </>
  );
};


// =========================================================
// STYLES
// =========================================================

const styles = StyleSheet.create({

  loadingContainer: {
    paddingVertical: 20,
    alignItems: "center",
  },


  card: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 15,
    marginVertical: 5,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    position: "relative",
  },


  statusBadge: {
    position: "absolute",
    top: 10,
    right: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 1,
  },


  statusBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
  },


  groupName: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "400",
    marginBottom: 2,
    letterSpacing: 0.5,
  },


  title: {
    fontSize: 20,
    color: "#333",
    marginBottom: 10,
    paddingRight: 90,
  },


  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
    marginLeft: 8,
  },


  userBlock: {
    marginBottom: 10,
  },


  userRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },


  icon: {
    marginRight: 6,
  },


  userValue: {
    fontSize: 13,
    color: "#333",
  },


  additionalContent: {
    marginTop: 10,
  },


  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },


  detailText: {
    fontSize: 16,
    color: "#444",
    flex: 1,
    lineHeight: 20,
  },


  userTakenText: {
    fontSize: 14,
    fontStyle: "italic",
    color: "#333",
    marginBottom: 10,
  },


  timeCriticalCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#FF3B3B",
    shadowColor: "#FF6B6B",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },


  timeCriticalWarning: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFE5E5",
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#FF6B6B",
  },


  timeCriticalWarningText: {
    flex: 1,
    fontSize: 13,
    color: "#C92A2A",
    fontWeight: "500",
  },


  timeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: 14,
    paddingVertical: 6,
    borderTopWidth: 0.5,
    borderTopColor: "#ddd",
  },


  timeBlock: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 8,
  },


  completedTimeBlock: {
    borderLeftWidth: 1,
    borderLeftColor: "#e0e0e0",
  },


  timeHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },


  timeLabel: {
    fontSize: 13,
    fontWeight: "600",
  },


  timeMain: {
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 20,
  },


  timeSub: {
    fontSize: 13,
    color: "#777",
    marginTop: 2,
    textAlign: "center",
  },


  takeButton: {
    marginTop: 10,
    backgroundColor: "#5FC994",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    minHeight: 44,
    justifyContent: "center",
  },


  takeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },


  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
    gap: 10,
  },


  statusButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
    minHeight: 44,
  },


  completeButton: {
    backgroundColor: "#6BA8D1",
  },


  cancelButton: {
    backgroundColor: "#E7E7E7",
  },


  statusButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },


  cancelButtonText: {
    color: "#555",
    fontSize: 16,
    fontWeight: "600",
  },


  buttonIcon: {
    marginRight: 4,
  },


  disabledButton: {
    opacity: 0.6,
  },


  chatTrigger: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: "#F9FAFB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },


  chatTriggerText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },


  deleteButton: {
    backgroundColor: "#E74C3C",
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    marginVertical: 5,
    borderRadius: 10,
  },


  deleteButtonContent: {
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
  },


  // =========================================================
  // CANCEL MODAL
  // =========================================================

  modalOverlay: {
    flex: 1,
    backgroundColor:
      "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },


  cancelModal: {
    width: "100%",
    maxWidth: 440,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
  },


  cancelModalTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#333",
    textAlign: "center",
  },


  cancelModalSubtitle: {
    marginTop: 7,
    marginBottom: 16,
    fontSize: 14,
    lineHeight: 20,
    color: "#666",
    textAlign: "center",
  },


  cancelReasonItem: {
    minHeight: 48,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ECECEC",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },


  cancelReasonText: {
    flex: 1,
    fontSize: 15,
    color: "#333",
    paddingRight: 12,
  },


  cancelLoading: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },


  cancelLoadingText: {
    marginLeft: 8,
    fontSize: 13,
    color: "#666",
  },


  keepTodoButton: {
    marginTop: 18,
    alignSelf: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
  },


  keepTodoButtonText: {
    color: "#4FB6B8",
    fontWeight: "600",
    fontSize: 15,
  },

});


export default CollapsibleTodoCard;