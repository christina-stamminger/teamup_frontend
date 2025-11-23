import React from "react";
import { createStackNavigator } from "@react-navigation/stack";

import BottomTabsNavigator from "./BottomTabsNavigator";
import ProfileScreen from "../components/ProfileScreen";
import MyTodosScreen from "../components/MyTodosScreen";
import MyGroups from "../components/MyGroups";
import GroupDetails from "../components/GroupDetails";

const Stack = createStackNavigator();

export default function AppStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeTabs" component={BottomTabsNavigator} />
      <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
      <Stack.Screen name="MyTodosScreen" component={MyTodosScreen} />
      <Stack.Screen name="MyGroups" component={MyGroups} />
      <Stack.Screen name="GroupDetails" component={GroupDetails} />
    </Stack.Navigator>
  );
}
