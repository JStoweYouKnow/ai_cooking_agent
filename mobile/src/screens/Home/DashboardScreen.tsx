import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  ScrollView,
  Pressable,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { resolveImageUrl } from "../../utils/imageUrl";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { trpc } from "../../api/trpc";
import GlassCard from "../../components/GlassCard";
import Badge from "../../components/Badge";
import LoadingSkeleton from "../../components/LoadingSkeleton";
import EmptyState from "../../components/EmptyState";
import RecipeGrid from "../../components/RecipeGrid";
import IconButton from "../../components/IconButton";
import AppLayout from "../../components/layout/AppLayout";
import ScreenHeader from "../../components/layout/ScreenHeader";
import CookingStats from "../../components/CookingStats";
import { colors, spacing, typography, borderRadius } from "../../styles/theme";
import { Recipe } from "../../types";
import { CREATOR_CONFIG } from "../../constants/creator";

const { width } = Dimensions.get("window");

const DashboardScreen = () => {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = React.useState(false);
  const [featuredImageError, setFeaturedImageError] = React.useState(false);
  const [featuredRecipeIndex, setFeaturedRecipeIndex] = React.useState<number | null>(null);

  // Fetch data
  const { data: user } = trpc.auth.me.useQuery();
  const {
    data: stats,
    refetch: refetchStats,
    isLoading: statsLoading,
  } = trpc.recipes.getStats.useQuery();
  const {
    data: recommendations,
    refetch: refetchRecs,
    isLoading: recommendationsLoading,
  } = trpc.recipes.getDailyRecommendations.useQuery();
  const {
    data: recentRecipes,
    refetch: refetchRecent,
    isLoading: recentLoading,
  } = trpc.recipes.getRecent.useQuery({ limit: 6 });

  // Randomly select a featured recipe from recommendations if user has no recent recipes
  // Otherwise, randomly select from recent recipes
  React.useEffect(() => {
    // If user has recent recipes, use those
    if (recentRecipes && recentRecipes.length > 0) {
      const randomIndex = Math.floor(Math.random() * recentRecipes.length);
      setFeaturedRecipeIndex(randomIndex);
    } 
    // If no recent recipes but we have recommendations, use those instead
    else if (recommendations) {
      const allRecs = [
        recommendations.breakfast,
        recommendations.lunch,
        recommendations.dinner,
        recommendations.dessert,
      ].filter(Boolean);
      if (allRecs.length > 0) {
        const randomIndex = Math.floor(Math.random() * allRecs.length);
        setFeaturedRecipeIndex(randomIndex);
      } else {
        setFeaturedRecipeIndex(null);
      }
    } else {
      setFeaturedRecipeIndex(null);
    }
  }, [recentRecipes, recommendations]);

  // Get the featured recipe based on the selected index
  const featuredRecipe = useMemo(() => {
    // Prefer recent recipes if available
    if (recentRecipes && recentRecipes.length > 0 && featuredRecipeIndex !== null) {
      return recentRecipes[featuredRecipeIndex];
    }
    // Fall back to recommendations if no recent recipes
    if (recommendations && featuredRecipeIndex !== null) {
      const allRecs = [
        recommendations.breakfast,
        recommendations.lunch,
        recommendations.dinner,
        recommendations.dessert,
      ].filter(Boolean);
      if (allRecs[featuredRecipeIndex]) {
        return allRecs[featuredRecipeIndex];
      }
    }
    return null;
  }, [recentRecipes, recommendations, featuredRecipeIndex]);

  const onRefresh = async () => {
    setRefreshing(true);
    const [statsResult, recsResult, recentResult] = await Promise.all([
      refetchStats(),
      refetchRecs(),
      refetchRecent(),
    ]);
    // Reset featured recipe index to get a new random selection after refresh
    const updatedRecentRecipes = recentResult.data;
    if (updatedRecentRecipes && updatedRecentRecipes.length > 0) {
      const randomIndex = Math.floor(Math.random() * updatedRecentRecipes.length);
      setFeaturedRecipeIndex(randomIndex);
    } else if (recsResult.data) {
      const allRecs = [
        recsResult.data.breakfast,
        recsResult.data.lunch,
        recsResult.data.dinner,
        recsResult.data.dessert,
      ].filter(Boolean);
      if (allRecs.length > 0) {
        const randomIndex = Math.floor(Math.random() * allRecs.length);
        setFeaturedRecipeIndex(randomIndex);
      } else {
        setFeaturedRecipeIndex(null);
      }
    } else {
      setFeaturedRecipeIndex(null);
    }
    setRefreshing(false);
  };

  const navigateToRecipe = (recipe: Recipe) =>
    navigation.navigate("Recipes" as never, {
      screen: "RecipeDetail",
      params: { id: recipe.id },
    } as never);

  const quickActions = useMemo(
    () => [
      {
        label: "Add Recipe",
        icon: "add-circle" as const,
        color: colors.olive,
        onPress: () =>
          navigation.navigate("Recipes" as never, {
            screen: "CreateRecipe",
          } as never),
      },
      {
        label: "Discover",
        icon: "search" as const,
        color: colors.russet,
        onPress: () => navigation.navigate("Recipes" as never),
      },
      {
        label: "Pantry",
        icon: "leaf" as const,
        color: "#4CAF50",
        onPress: () => navigation.navigate("Ingredients" as never),
      },
      {
        label: "New List",
        icon: "cart" as const,
        color: "#2196F3",
        onPress: () =>
          navigation.navigate("ShoppingLists" as never, {
            screen: "CreateShoppingList",
          } as never),
      },
      {
        label: "Sous AI",
        icon: "sparkles" as const,
        color: colors.navy,
        onPress: () =>
          navigation.navigate("Settings" as never, {
            screen: "AIAssistant",
          } as never),
      },
      {
        label: "Cook with What You Have",
        icon: "camera" as const,
        color: colors.olive,
        onPress: () =>
          navigation.navigate("Recipes" as never, {
            screen: "PantryGenerator",
          } as never),
      },
    ],
    [navigation]
  );

  const StatCard = ({ icon, label, value, color }: any) => (
    <View
      style={[styles.statCard, { borderLeftColor: color }]}
      accessibilityRole="summary"
      accessibilityLabel={`${label} ${value ?? 0}`}
      accessibilityHint={`Total ${label.toLowerCase()}`}
    >
      <Ionicons name={icon} size={24} color={color} />
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value || 0}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );

  const RecommendationCard = ({ recipe, mealType }: any) => {
    const [imageError, setImageError] = React.useState(false);
    
    // Resolve image URL (handles relative URLs)
    const imageUri = React.useMemo(() => {
      return resolveImageUrl(recipe.imageUrl);
    }, [recipe.imageUrl]);

    // LLM-generated recipes (id: -1) can't be viewed yet
    const isLLMGenerated = recipe.id === -1;
    const handlePress = () => {
      if (isLLMGenerated) {
        Alert.alert(
          "AI Generated Recipe",
          "This recipe was generated by AI. Save it to your collection to view full details.",
          [{ text: "OK" }]
        );
        return;
      }
      navigation.navigate("Recipes" as never, {
        screen: "RecipeDetail",
        params: { id: recipe.id }
      } as never);
    };

    return (
      <TouchableOpacity
        style={styles.recCard}
        onPress={handlePress}
      >
        <GlassCard style={styles.recGlass}>
          {imageUri && !imageError ? (
            <Image 
              source={{ uri: imageUri }} 
              style={styles.recImage}
              contentFit="cover"
              transition={200}
              onError={(error) => {
                console.error("[RecommendationCard] Image load error:", error, "URL:", imageUri);
                setImageError(true);
              }}
            />
          ) : (
            <View style={styles.recImagePlaceholder}>
              <Ionicons name="restaurant" size={40} color={colors.olive} />
            </View>
          )}
        <View style={styles.recContent}>
          <Text style={styles.recMealType}>{mealType}</Text>
          <Text style={styles.recName} numberOfLines={2}>{recipe.name}</Text>
          {(recipe.source === 'ai' || recipe.source === 'LLM' || isLLMGenerated) && <Badge label="AI Generated" variant="ai" />}
          <View style={styles.recMeta}>
            {recipe.cookingTime != null && recipe.cookingTime > 0 ? (
              <View style={styles.recMetaItem}>
                <Ionicons name="time-outline" size={14} color={colors.text.secondary} />
                <Text style={styles.recMetaText}>{recipe.cookingTime}m</Text>
              </View>
            ) : null}
            {recipe.cuisine ? (
              <Badge label={recipe.cuisine} variant="cuisine" />
            ) : null}
          </View>
        </View>
      </GlassCard>
    </TouchableOpacity>
    );
  };

  return (
    <AppLayout
      scrollable
      contentContainerStyle={styles.content}
      scrollProps={{
        refreshControl: <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />,
      }}
    >
      <ScreenHeader
        title="Ready, Chef!"
        subtitle={user?.name ? `Good to see you, ${user.name}` : "Your culinary journey awaits"}
        actionLabel="Settings"
        onActionPress={() => navigation.navigate("Settings" as never)}
        showSearch
      />

      {/* Cooking Stats & Streak */}
      <CookingStats style={styles.cookingStats} />

      {/* Featured by Eitan - creator-branded row */}
      {CREATOR_CONFIG.featuredRecipes && CREATOR_CONFIG.featuredRecipes.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured by {CREATOR_CONFIG.name}</Text>
            <Text style={styles.sectionSubtitle}>{CREATOR_CONFIG.handle}</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.creatorFeaturedScroll}
          >
            {CREATOR_CONFIG.featuredRecipes.map((item, index) => {
              const onPress = () => {
                if (item.sourceUrl) {
                  navigation.navigate("Recipes" as never, {
                    screen: "CreateRecipe",
                    params: { initialUrl: item.sourceUrl } as never,
                  } as never);
                } else {
                  navigation.navigate("Recipes" as never, { screen: "RecipeListScreen" } as never);
                }
              };
              return (
                <TouchableOpacity
                  key={`creator-featured-${index}`}
                  style={styles.creatorFeaturedCard}
                  onPress={onPress}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.name}, featured by ${CREATOR_CONFIG.name}. Import recipe`}
                >
                  <GlassCard style={styles.creatorFeaturedGlass}>
                    {item.imageUrl ? (
                      <Image
                        source={{ uri: item.imageUrl }}
                        style={styles.creatorFeaturedImage}
                        contentFit="cover"
                        cachePolicy="memory-disk"
                      />
                    ) : (
                      <View style={styles.creatorFeaturedPlaceholder}>
                        <Ionicons name="restaurant" size={32} color={colors.olive} />
                      </View>
                    )}
                    <View style={styles.creatorFeaturedContent}>
                      <Text style={styles.creatorFeaturedName} numberOfLines={2}>
                        {item.name}
                      </Text>
                      {item.description ? (
                        <Text style={styles.creatorFeaturedDesc} numberOfLines={2}>
                          {item.description}
                        </Text>
                      ) : null}
                      <Text style={styles.creatorFeaturedCta}>Import recipe →</Text>
                    </View>
                  </GlassCard>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Featured Recipe */}
      {featuredRecipe && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>⭐ Featured Recipe</Text>
          </View>
          <TouchableOpacity
            style={styles.featuredCard}
            onPress={() => navigateToRecipe(featuredRecipe)}
            accessibilityRole="button"
            accessibilityLabel={`View featured recipe ${featuredRecipe.name}`}
          >
            {(() => {
              const imageUri = resolveImageUrl(featuredRecipe.imageUrl);
              return imageUri && !featuredImageError ? (
                <Image 
                  source={{ uri: imageUri }} 
                  style={styles.featuredImage}
                  contentFit="cover"
                  transition={200}
                  onError={(error) => {
                    console.error("[FeaturedRecipe] Image load error:", error, "URL:", imageUri);
                    setFeaturedImageError(true);
                  }}
                />
              ) : (
                <View style={styles.featuredImagePlaceholder}>
                  <Ionicons name="restaurant" size={48} color={colors.olive} />
                </View>
              );
            })()}
            <View style={styles.featuredContent}>
              <Text style={styles.featuredTitle} numberOfLines={2}>
                {featuredRecipe.name}
              </Text>
              {featuredRecipe.description ? (
                <Text style={styles.featuredDescription} numberOfLines={2}>
                  {featuredRecipe.description}
                </Text>
              ) : null}
              <View style={styles.featuredMeta}>
                {featuredRecipe.cookingTime != null && featuredRecipe.cookingTime > 0 ? (
                  <View style={styles.featuredMetaItem}>
                    <Ionicons name="time-outline" size={16} color={colors.text.secondary} />
                    <Text style={styles.featuredMetaText}>{featuredRecipe.cookingTime}m</Text>
                  </View>
                ) : null}
                {featuredRecipe.cuisine ? (
                  <Badge label={featuredRecipe.cuisine} variant="cuisine" />
                ) : null}
              </View>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Quick Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Kitchen</Text>
        <View style={styles.statsGrid}>
          {statsLoading
            ? Array.from({ length: 4 }).map((_, idx) => (
                <GlassCard key={`stat-skeleton-${idx}`} style={styles.statSkeleton}>
                  <LoadingSkeleton width={40} height={40} variant="circle" />
                  <View style={styles.statContent}>
                    <LoadingSkeleton width="60%" height={16} />
                    <LoadingSkeleton width="40%" height={12} />
                  </View>
                </GlassCard>
              ))
            : (
              <>
                <StatCard
                  icon="restaurant"
                  label="Recipes"
                  value={stats?.recipeCount}
                  color={colors.olive}
                />
                <StatCard
                  icon="leaf"
                  label="Pantry Items"
                  value={stats?.ingredientCount}
                  color="#4CAF50"
                />
                <StatCard
                  icon="cart"
                  label="Shopping Lists"
                  value={stats?.shoppingListCount}
                  color={colors.russet}
                />
                <StatCard
                  icon="heart"
                  label="Favorites"
                  value={stats?.favoriteCount}
                  color="#FF4444"
                />
              </>
            )}
        </View>
      </View>

      {/* Daily Recommendations */}
      <View style={styles.section}>
        <View style={styles.recommendationsHeader}>
          <Text style={styles.sectionTitle}>✨ Daily Recommendations</Text>
          <Text style={styles.sectionSubtitle}>Personalized for you</Text>
        </View>
        {recommendationsLoading && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recsScroll}>
            {Array.from({ length: 3 }).map((_, idx) => (
              <GlassCard key={`rec-skeleton-${idx}`} style={[styles.recGlass, styles.recCard]}>
                <LoadingSkeleton width="100%" height={120} borderRadiusOverride={borderRadius.md} />
                <LoadingSkeleton width="80%" height={18} />
                <LoadingSkeleton width="40%" height={14} />
              </GlassCard>
            ))}
          </ScrollView>
        )}
        {!recommendationsLoading && recommendations && (() => {
          const { breakfast, lunch, dinner, dessert } = recommendations;
          const mealTypes = [
            { key: 'breakfast' as const, recipe: breakfast, label: 'Breakfast' },
            { key: 'lunch' as const, recipe: lunch, label: 'Lunch' },
            { key: 'dinner' as const, recipe: dinner, label: 'Dinner' },
            { key: 'dessert' as const, recipe: dessert, label: 'Dessert' },
          ].filter(item => item.recipe !== null);

          if (mealTypes.length === 0) {
            return (
              <EmptyState
                title="No recommendations yet"
                description="Import or create recipes to unlock personalized suggestions."
                primaryActionLabel="Discover Recipes"
                onPrimaryAction={() => navigation.navigate("Recipes" as never)}
              />
            );
          }

          return (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recsScroll}>
              {mealTypes.map((item) => (
                <RecommendationCard 
                  key={item.key} 
                  recipe={item.recipe} 
                  mealType={item.label}
                />
              ))}
            </ScrollView>
          );
        })()}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actionsRow}>
          {quickActions.map((action) => (
            <Pressable
              key={action.label}
              style={({ pressed }) => [
                styles.actionButton,
                pressed && styles.actionButtonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={action.label}
              onPress={action.onPress}
            >
              <IconButton
                icon={<Ionicons name={action.icon} size={24} color="#fff" />}
                onPress={action.onPress}
                style={{ backgroundColor: action.color }}
              />
              <Text style={styles.actionLabel}>{action.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Recent Recipes */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Recipes</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Recipes" as never)}>
            <Text style={styles.seeAll}>See All →</Text>
          </TouchableOpacity>
        </View>
        {recentLoading && (
          <View style={styles.recipesGrid}>
            {Array.from({ length: 4 }).map((_, idx) => (
              <GlassCard key={`recent-skeleton-${idx}`} style={styles.recipeCard}>
                <LoadingSkeleton width="100%" height={100} borderRadiusOverride={borderRadius.md} />
                <LoadingSkeleton width="80%" height={14} />
                <LoadingSkeleton width="40%" height={12} />
              </GlassCard>
            ))}
          </View>
        )}
        {!recentLoading && recentRecipes && recentRecipes.length > 0 && (
          <RecipeGrid
            recipes={recentRecipes}
            onSelect={navigateToRecipe}
            scrollEnabled={false}
            ListEmptyComponent={null}
            numColumns={1}
          />
        )}
        {!recentLoading && (!recentRecipes || recentRecipes.length === 0) && (
          <EmptyState
            title="No recipes yet"
            description="Import from URL, create your own, or save from discovery to see them here."
            primaryActionLabel="Add Recipe"
            onPrimaryAction={() =>
              navigation.navigate("Recipes" as never, { screen: "CreateRecipe" } as never)
            }
          />
        )}
      </View>

      <View style={{ height: 48 }} />
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  cookingStats: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  recommendationsHeader: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.navy,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  seeAll: {
    fontSize: typography.fontSize.sm,
    color: colors.olive,
    fontWeight: typography.fontWeight.semibold,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -spacing.xs,
  },
  statCard: {
    width: (width - spacing.md * 2 - spacing.xs * 2) / 2,
    backgroundColor: "white",
    borderRadius: borderRadius.md,
    padding: spacing.md,
    margin: spacing.xs,
    flexDirection: "row",
    alignItems: "center",
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statSkeleton: {
    width: (width - spacing.md * 2 - spacing.xs * 2) / 2,
    margin: spacing.xs,
    flexDirection: "row",
    alignItems: "center",
  },
  statContent: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  statValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.navy,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  },
  actionsRow: {
    flexDirection: "row",
    paddingHorizontal: spacing.xs,
  },
  actionButton: {
    alignItems: "center",
    marginRight: spacing.lg,
  },
  actionButtonPressed: {
    transform: [{ scale: 0.97 }],
  },
  actionLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.navy,
    fontWeight: typography.fontWeight.medium,
    marginTop: spacing.xs,
  },
  recsScroll: {
    paddingRight: spacing.md,
  },
  creatorFeaturedScroll: {
    paddingRight: spacing.md,
    gap: spacing.md,
  },
  creatorFeaturedCard: {
    width: width * 0.65,
    marginRight: spacing.md,
  },
  creatorFeaturedGlass: {
    overflow: "hidden",
    padding: 0,
  },
  creatorFeaturedImage: {
    width: "100%",
    height: 100,
    borderRadius: borderRadius.md,
  },
  creatorFeaturedPlaceholder: {
    width: "100%",
    height: 100,
    backgroundColor: colors.olive + "15",
    justifyContent: "center",
    alignItems: "center",
  },
  creatorFeaturedContent: {
    padding: spacing.sm,
  },
  creatorFeaturedName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.navy,
    marginBottom: spacing.xs,
  },
  creatorFeaturedDesc: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  creatorFeaturedCta: {
    fontSize: typography.fontSize.xs,
    color: colors.olive,
    fontWeight: typography.fontWeight.semibold,
  },
  recCard: {
    width: width * 0.7,
    marginRight: spacing.md,
  },
  recGlass: {
    padding: spacing.md,
  },
  recImage: {
    width: "100%",
    height: 140,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  recImagePlaceholder: {
    width: "100%",
    height: 120,
    backgroundColor: colors.olive + '10',
    borderRadius: borderRadius.md,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  recContent: {},
  recMealType: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.semibold,
    textTransform: "uppercase",
    marginBottom: spacing.xs,
  },
  recName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.navy,
    marginBottom: spacing.sm,
  },
  recMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  recMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  recMetaText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  },
  recipesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -spacing.xs,
  },
  recipeCard: {
    padding: spacing.sm,
    flex: 1,
    margin: spacing.xs,
  },
  featuredCard: {
    marginHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    backgroundColor: colors.surface,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  featuredImage: {
    width: "100%",
    height: 200,
    resizeMode: "cover",
  },
  featuredImagePlaceholder: {
    width: "100%",
    height: 200,
    backgroundColor: colors.glass.background,
    justifyContent: "center",
    alignItems: "center",
  },
  featuredContent: {
    padding: spacing.lg,
  },
  featuredTitle: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.navy,
    marginBottom: spacing.sm,
  },
  featuredDescription: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  featuredMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  featuredMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  featuredMetaText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
});

export default DashboardScreen;
