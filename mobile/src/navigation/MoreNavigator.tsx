import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MoreStackParamList } from "./types";
import SettingsScreen from "../screens/Settings/SettingsScreen";
import MessagesListScreen from "../screens/Messages/MessagesListScreen";
import ChatScreen from "../screens/Messages/ChatScreen";
import NotificationsScreen from "../screens/Notifications/NotificationsScreen";
import AIAssistantScreen from "../screens/AI/AIAssistantScreen";
import RecipeGeneratorScreen from "../screens/AI/RecipeGeneratorScreen";
import SubscriptionScreen from "../screens/Settings/SubscriptionScreen";

const Stack = createNativeStackNavigator<MoreStackParamList>();

const MoreNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ animation: "fade" }}>
      <Stack.Screen
        name="SettingsMain"
        component={SettingsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MessagesList"
        component={MessagesListScreen}
        options={{ title: "Messages" }}
      />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={({ route }) => ({
          title: route.params?.participantName || "Chat",
        })}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: "Notifications" }}
      />
      <Stack.Screen
        name="AIAssistant"
        component={AIAssistantScreen}
        options={{ title: "Sous Assistant" }}
      />
      <Stack.Screen
        name="RecipeGenerator"
        component={RecipeGeneratorScreen}
        options={{ title: "AI Recipe Generator" }}
      />
      <Stack.Screen
        name="Subscription"
        component={SubscriptionScreen}
        options={{ title: "Subscription" }}
      />
    </Stack.Navigator>
  );
};

export default MoreNavigator;

