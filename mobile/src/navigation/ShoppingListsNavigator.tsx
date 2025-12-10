import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ShoppingListStackParamList } from "./types";
import ShoppingListsListScreen from "../screens/ShoppingLists/ShoppingListsListScreen";
import ShoppingListDetailScreen from "../screens/ShoppingLists/ShoppingListDetailScreen";
import CreateShoppingListScreen from "../screens/ShoppingLists/CreateShoppingListScreen";

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
