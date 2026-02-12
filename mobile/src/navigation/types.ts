import type { NavigatorScreenParams } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

// Home Stack Navigator
export type HomeStackParamList = {
  DashboardMain: undefined;
};

// Ingredients Stack Navigator
export type IngredientsStackParamList = {
  IngredientsMain: undefined;
};

// Recipe Stack Navigator
export type RecipeStackParamList = {
  RecipeList: undefined;
  RecipeDetail: { id: number };
  CreateRecipe: { initialUrl?: string } | undefined;
  PantryGenerator: undefined;
};

// Shopping List Stack Navigator
export type ShoppingListStackParamList = {
  ShoppingListsList: undefined;
  ShoppingListDetail: { id: number };
  CreateShoppingList: undefined;
};

export type MoreStackParamList = {
  SettingsMain: undefined;
  MessagesList: undefined;
  Chat: { conversationId: number; participantName?: string };
  Notifications: undefined;
  AIAssistant: undefined;
  RecipeGenerator: undefined;
  MealPlanning: undefined;
  Subscription: undefined;
  ButtonShowcase: undefined;
};

// Main Tab Navigator
export type MainTabParamList = {
  Home: NavigatorScreenParams<HomeStackParamList> | undefined;
  Recipes: NavigatorScreenParams<RecipeStackParamList> | undefined;
  ShoppingLists: NavigatorScreenParams<ShoppingListStackParamList> | undefined;
  Ingredients: NavigatorScreenParams<IngredientsStackParamList> | undefined;
  Settings: NavigatorScreenParams<MoreStackParamList> | undefined;
};

// Root Stack Navigator
export type RootStackParamList = {
  Login: undefined;
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
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

export type MoreStackScreenProps<T extends keyof MoreStackParamList> = NativeStackScreenProps<
  MoreStackParamList,
  T
>;
