import React from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { trpc } from "../../api/trpc";
import Card from "../../components/Card";
import RecipeCard from "../../components/RecipeCard";

const HomeScreen = () => {
  const navigation = useNavigation();

  // Fetch dashboard data
  // @ts-ignore - tRPC types are complex, runtime works correctly
  const { data: recentRecipes, isLoading: recipesLoading } = trpc.recipes.list.useQuery();
  
  // Calculate stats from recipes data
  const stats = recentRecipes ? {
    recipeCount: recentRecipes.length,
    shoppingListCount: 0, // TODO: Fetch shopping lists to get accurate count
    ingredientCount: 0, // TODO: Calculate from recipes if needed
    favoriteCount: recentRecipes.filter((r: any) => {
      const fav = r.isFavorite;
      return fav === true || fav === "true" || (typeof fav === "number" && fav === 1);
    }).length,
  } : null;
  const statsLoading = recipesLoading;

  if (statsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6B8E23" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome Back! 👋</Text>
        <Text style={styles.subtitle}>What would you like to cook today?</Text>
      </View>

      {/* Stats Overview */}
      <View style={styles.statsContainer}>
        <View style={styles.statRow}>
          <Card style={styles.statCard}>
            <Ionicons name="restaurant" size={32} color="#6B8E23" />
            <Text style={styles.statNumber}>{stats?.recipeCount || 0}</Text>
            <Text style={styles.statLabel}>Recipes</Text>
          </Card>
          <Card style={styles.statCard}>
            <Ionicons name="cart" size={32} color="#6B8E23" />
            <Text style={styles.statNumber}>{stats?.shoppingListCount || 0}</Text>
            <Text style={styles.statLabel}>Shopping Lists</Text>
          </Card>
        </View>
        <View style={styles.statRow}>
          <Card style={styles.statCard}>
            <Ionicons name="leaf" size={32} color="#6B8E23" />
            <Text style={styles.statNumber}>{stats?.ingredientCount || 0}</Text>
            <Text style={styles.statLabel}>Ingredients</Text>
          </Card>
          <Card style={styles.statCard}>
            <Ionicons name="heart" size={32} color="#ff4444" />
            <Text style={styles.statNumber}>{stats?.favoriteCount || 0}</Text>
            <Text style={styles.statLabel}>Favorites</Text>
          </Card>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            // @ts-expect-error - React Navigation nested navigation typing
            onPress={() => navigation.navigate("Recipes" as never, { screen: "CreateRecipe" } as never)}
          >
            <Ionicons name="add-circle" size={24} color="#6B8E23" />
            <Text style={styles.actionText}>Add Recipe</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            // @ts-expect-error - React Navigation nested navigation typing
            onPress={() => navigation.navigate("ShoppingLists" as never, { screen: "CreateShoppingList" } as never)}
          >
            <Ionicons name="cart" size={24} color="#6B8E23" />
            <Text style={styles.actionText}>New List</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate("Recipes" as never)}
          >
            <Ionicons name="search" size={24} color="#6B8E23" />
            <Text style={styles.actionText}>Browse</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Recipes */}
      {!recipesLoading && recentRecipes && recentRecipes.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Recipes</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Recipes" as never)}>
              <Text style={styles.seeAll}>See All →</Text>
            </TouchableOpacity>
          </View>
          {recentRecipes.slice(0, 3).map((recipe: any) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              // @ts-expect-error - React Navigation nested navigation typing
              onPress={() => navigation.navigate("Recipes" as never, { screen: "RecipeDetail", params: { id: recipe.id } } as never)}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F0",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F0",
  },
  header: {
    padding: 24,
    paddingTop: 16,
  },
  greeting: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
  statsContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statCard: {
    flex: 1,
    marginHorizontal: 0,
    marginVertical: 4,
    marginRight: 8,
    alignItems: "center",
    paddingVertical: 20,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  seeAll: {
    fontSize: 14,
    color: "#6B8E23",
    fontWeight: "600",
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 24,
  },
  actionButton: {
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    minWidth: 100,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionText: {
    fontSize: 14,
    color: "#333",
    marginTop: 8,
    fontWeight: "600",
  },
});

export default HomeScreen;
