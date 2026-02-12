import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MoreStackParamList } from "./types";
import { createLazyScreen } from "../utils/lazyScreen";

// Eager load - initial screen
import SettingsScreen from "../screens/Settings/SettingsScreen";

// Lazy load - secondary screens for better initial load performance
const MessagesListScreen = createLazyScreen(
  () => import("../screens/Messages/MessagesListScreen")
);
const ChatScreen = createLazyScreen(
  () => import("../screens/Messages/ChatScreen")
);
const NotificationsScreen = createLazyScreen(
  () => import("../screens/Notifications/NotificationsScreen")
);
const AIAssistantScreen = createLazyScreen(
  () => import("../screens/AI/AIAssistantScreen")
);
const RecipeGeneratorScreen = createLazyScreen(
  () => import("../screens/AI/RecipeGeneratorScreen")
);
const SubscriptionScreen = createLazyScreen(
  () => import("../screens/Settings/SubscriptionScreen")
);
const MealPlanningScreen = createLazyScreen(
  () => import("../screens/MealPlanning/MealPlanningScreen")
);
const ButtonShowcaseScreen = createLazyScreen(
  () => import("../screens/ButtonShowcaseScreen")
);

const Stack = createNativeStackNavigator<MoreStackParamList>();

const MoreNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ animation: "fade" }}>
      <Stack.Screen
        name="SettingsMain"
        component={SettingsScreen}
        options={{ 
          headerShown: false,
          title: "Settings"
        }}
      />
      <Stack.Screen
        name="MessagesList"
        component={MessagesListScreen}
        options={{ 
          title: "Messages",
          headerBackTitle: "Settings"
        }}
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
        options={{ 
          title: "Notifications",
          headerBackTitle: "Settings"
        }}
      />
      <Stack.Screen
        name="AIAssistant"
        component={AIAssistantScreen}
        options={{ 
          title: "Sous Assistant",
          headerBackTitle: "Settings"
        }}
      />
      <Stack.Screen
        name="RecipeGenerator"
        component={RecipeGeneratorScreen}
        options={{ 
          title: "AI Recipe Generator",
          headerBackTitle: "Settings"
        }}
      />
      <Stack.Screen
        name="MealPlanning"
        component={MealPlanningScreen}
        options={{ 
          title: "Meal Planning",
          headerBackTitle: "Settings"
        }}
      />
      <Stack.Screen
        name="Subscription"
        component={SubscriptionScreen}
        options={{ 
          title: "Subscription",
          headerBackTitle: "Settings"
        }}
      />
      <Stack.Screen
        name="ButtonShowcase"
        component={ButtonShowcaseScreen}
        options={{ 
          title: "Button Showcase",
          headerBackTitle: "Settings"
        }}
      />
    </Stack.Navigator>
  );
};

export default MoreNavigator;

