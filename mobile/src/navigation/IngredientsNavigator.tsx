import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { IngredientsStackParamList } from "./types";
import IngredientsScreen from "../screens/Ingredients/IngredientsScreen";

const Stack = createNativeStackNavigator<IngredientsStackParamList>();

const IngredientsNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false, animation: "fade" }}>
    <Stack.Screen name="IngredientsMain" component={IngredientsScreen} />
  </Stack.Navigator>
);

export default IngredientsNavigator;

