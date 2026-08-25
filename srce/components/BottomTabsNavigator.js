import React, { useState, useEffect } from "react";
import { View, TouchableOpacity } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Toast from "react-native-toast-message";
import { Icons } from "../ui/icons";
import BringitsChip from "../components/BringitsChip";
import LogoutButton from "../components/LogoutButton";
import MyTodosScreen from "../components/MyTodosScreen";
import OpenTodosScreen from "../components/OpenTodosScreen";
import CreateTodoScreen from "../components/CreateTodoScreen";
//import MyGroups from "../components/MyGroups";
import GroupCreationModal from "./GroupCreationModal";
import { useUser } from "../components/context/UserContext";
import { useUnread } from "../components/context/UnreadContext";
import { useGroups } from "../components/context/GroupContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";


const Tab = createBottomTabNavigator();

export default function BottomTabsNavigator({ navigation }) {
  const {
    username,
    userId,
    bringits,
    accessToken,
  } = useUser();

  const insets = useSafeAreaInsets();
  const { hasAnyUnread } = useUnread();
  const { groups, refreshGroups } = useGroups();

  const [isModalVisible, setModalVisible] = useState(false);

  const hasGroups = Array.isArray(groups) && groups.length > 0;

  useEffect(() => {
    if (!accessToken) {
      setModalVisible(false);
      return;
    }

    if (userId) {
      refreshGroups();
    }
  }, [accessToken, userId, refreshGroups]);

  if (!accessToken) {
    return null;
  }

  return (
    <>
      <Tab.Navigator
        screenOptions={{
          headerTitle: username ? `Hallo ${username}` : "",
          headerTitleAlign: "center",
          headerStyle: {
            backgroundColor: "#fff",
            shadowOpacity: 0,
            elevation: 0,
            borderBottomWidth: 1,
            borderBottomColor: "#F1F2F4",
          },
          headerTitleStyle: {
            fontSize: 17,
            fontWeight: "700",
            color: "#12151A",
          },

          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate("ProfileScreen")}
              style={{ marginLeft: 16 }}
            >
              <Icons.User2 size={24} color="#3FA9AB" />
            </TouchableOpacity>
          ),

          headerRight: () => (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <BringitsChip
                value={bringits}
                onPress={() => navigation.navigate("ProfileScreen")}
              />
              <LogoutButton />
            </View>
          ),

          tabBarActiveTintColor: "#3FA9AB",
          tabBarInactiveTintColor: "#9CA3AF",
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "600",
          },
          tabBarStyle: {
            backgroundColor: "#FFFFFF",
            borderTopWidth: 1,
            borderTopColor: "#F1F2F4",

            height: 62 + Math.max(insets.bottom, 12),

            paddingTop: 8,

            paddingBottom: Math.max(
              insets.bottom,
              12
            ),

            shadowColor: "#12151A",
            shadowOpacity: 0.04,
            shadowRadius: 12,
            shadowOffset: {
              width: 0,
              height: -4,
            },
          },
        }}
      >
        <Tab.Screen
          name="Meine Todos"
          component={MyTodosScreen}
          options={{
            tabBarLabel: "Meine Todos",
            tabBarIcon: ({ color }) => (
              <View style={{ width: 26, height: 26 }}>
                <Icons.Home size={28} color={color} />

                {hasAnyUnread && (
                  <View
                    style={{
                      position: "absolute",
                      top: -2,
                      right: -2,
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: "#F04438",
                    }}
                  />
                )}
              </View>
            ),
          }}
        />

        <Tab.Screen
          name="Offene Todos"
          component={OpenTodosScreen}
          options={{
            tabBarLabel: "Offene Todos",
            tabBarIcon: ({ color }) => (
              <Icons.ClipboardList size={28} color={color} />
            ),
          }}
        />

        <Tab.Screen
          name="Todo erstellen"
          component={CreateTodoScreen}
          options={{
            tabBarLabel: "Todo erstellen",
            tabBarIcon: ({ color }) => (
              <Icons.PlusCircle size={28} color={color} />
            ),
          }}
        />
{/*
        <Tab.Screen
          name="Meine Gruppen"
          component={MyGroups}
          options={{
            tabBarLabel: "Gruppen",
            tabBarIcon: ({ color }) => (
              <Icons.Users size={28} color={color} />
            ),
          }}
        />
        */}
      </Tab.Navigator>

      <GroupCreationModal
        isVisible={isModalVisible}
        onClose={() => setModalVisible(false)}
        userId={userId}
      />
    </>
  );
}