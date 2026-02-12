import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ShoppingListStackParamList } from "./types";
import { createLazyScreen } from "../utils/lazyScreen";

// Eager load - initial screen
import ShoppingListsListScreen from "../screens/ShoppingLists/ShoppingListsListScreen";

// Lazy load - secondary screens
const ShoppingListDetailScreen = createLazyScreen(
  () => import("../screens/ShoppingLists/ShoppingListDetailScreen")
);
const CreateShoppingListScreen = createLazyScreen(
  () => import("../screens/ShoppingLists/CreateShoppingListScreen")
);

const Stack = createNativeStackNavigator<ShoppingListStackParamList>();

const ShoppingListsNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: "#6B8E23",
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
        animation: "fade",
      }}
    >
      <Stack.Screen
        name="ShoppingListsList"
        component={ShoppingListsListScreen}
        options={{ title: "Shopping Lists" }}
      />
      <Stack.Screen
        name="ShoppingListDetail"
        component={ShoppingListDetailScreen}
        options={{ title: "Shopping List" }}
      />
      <Stack.Screen
        name="CreateShoppingList"
        component={CreateShoppingListScreen}
        options={{ title: "New Shopping List" }}
      />
    </Stack.Navigator>
  );
};

export default ShoppingListsNavigator;
