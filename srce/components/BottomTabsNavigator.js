import React, { useState } from "react";
import { TouchableOpacity } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Home, ClipboardList, PlusCircle, Users } from "lucide-react-native";
import MyTodosScreen from "../components/MyTodosScreen";
import OpenTodosScreen from "../components/OpenTodosScreen";
import CreateTodoScreen from "../components/CreateTodoScreen";
import LogoutButton from "../components/LogoutButton";
import GroupModal from "../components/GroupModal";

const Tab = createBottomTabNavigator();

export default function BottomTabsNavigator({ navigation }) {
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState("Family");

  const toggleModal = () => setModalVisible(!isModalVisible);
  const handleGroupSelect = (group) => {
    setSelectedGroup(group);
    setModalVisible(false);
  };

  return (
    <>
      <Tab.Navigator
        screenOptions={{
          headerRight: () => <LogoutButton navigation={navigation} />,
          headerLeft: () => (
            <TouchableOpacity onPress={toggleModal} style={{ marginLeft: 16 }}>
              <Users size={24} color="#5FC9C9" />
            </TouchableOpacity>
          ),
          headerTitle: "BringIt",
          headerTitleAlign: "center",
        }}
      >
        <Tab.Screen name="MyTodos" component={MyTodosScreen} options={{ tabBarIcon: ({ color }) => <Home size={24} color={color} /> }} />
        <Tab.Screen name="OpenTodos" component={OpenTodosScreen} options={{ tabBarIcon: ({ color }) => <ClipboardList size={24} color={color} /> }} />
        <Tab.Screen name="CreateTodo" component={CreateTodoScreen} options={{ tabBarIcon: ({ color }) => <PlusCircle size={24} color={color} /> }} />
      </Tab.Navigator>

      {/* Group Modal */}
      <GroupModal isVisible={isModalVisible} toggleModal={toggleModal} selectedGroup={selectedGroup} handleGroupSelect={handleGroupSelect} />
    </>
  );
}
