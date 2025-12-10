import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";

// Root Stack Navigator
export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
};

// Main Tab Navigator
export type MainTabParamList = {
  Home: undefined;
  Recipes: undefined;
  ShoppingLists: undefined;
  Ingredients: undefined;
  Settings: undefined;
};

export type HomeStackParamList = {
  DashboardMain: undefined;
};

export type IngredientsStackParamList = {
  IngredientsMain: undefined;
};

// Recipe Stack Navigator
export type RecipeStackParamList = {
  RecipeList: undefined;
  RecipeDetail: { id: number };
  CreateRecipe: undefined;
};

// Shopping List Stack Navigator
export type ShoppingListStackParamList = {
  ShoppingListsList: undefined;
  ShoppingListDetail: { id: number };
  CreateShoppingList: undefined;
};

// Type helpers for screens
export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

export type MainTabScreenProps<T extends keyof MainTabParamList> = BottomTabScreenProps<
  MainTabParamList,
  T
>;

export type RecipeStackScreenProps<T extends keyof RecipeStackParamList> = NativeStackScreenProps<
  RecipeStackParamList,
  T
>;

export type HomeStackScreenProps<T extends keyof HomeStackParamList> = NativeStackScreenProps<
  HomeStackParamList,
  T
>;

export type ShoppingListStackScreenProps<T extends keyof ShoppingListStackParamList> =
  NativeStackScreenProps<ShoppingListStackParamList, T>;

export type IngredientsStackScreenProps<T extends keyof IngredientsStackParamList> = NativeStackScreenProps<
  IngredientsStackParamList,
  T
>;

export type MoreStackParamList = {
  SettingsMain: undefined;
  MessagesList: undefined;
  Chat: { conversationId: number; participantName?: string };
  Notifications: undefined;
  AIAssistant: undefined;
  RecipeGenerator: undefined;
  Subscription: undefined;
};

export type MoreStackScreenProps<T extends keyof MoreStackParamList> = NativeStackScreenProps<
  MoreStackParamList,
  T
>;
