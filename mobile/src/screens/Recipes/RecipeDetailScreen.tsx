import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
  Dimensions,
  TextInput,
  FlatList,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { resolveImageUrl } from "../../utils/imageUrl";
import { Ionicons } from "@expo/vector-icons";
import { RecipeStackScreenProps } from "../../navigation/types";
import { trpc } from "../../api/trpc";
import GlassCard from "../../components/GlassCard";
import IngredientList from "../../components/IngredientList";
import CookingSteps from "../../components/CookingSteps";
import RecipeTags from "../../components/RecipeTags";
import GradientButton from "../../components/GradientButton";
import LoadingSkeleton from "../../components/LoadingSkeleton";
import CookingModeScreen from "./CookingModeScreen";
import { colors, spacing, typography, borderRadius } from "../../styles/theme";
import { normalizeIsFavorite } from "../../utils/favorites";

type Props = RecipeStackScreenProps<"RecipeDetail">;
const { width } = Dimensions.get("window");

const RecipeDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { id } = route.params;
  const utils = trpc.useUtils();
  const insets = useSafeAreaInsets();
  const [cookingModeVisible, setCookingModeVisible] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecipient, setSelectedRecipient] = useState<number | null>(null);

  const { data: recipe, isLoading } = trpc.recipes.getById.useQuery({ id });
  const { data: recipeIngredients, isLoading: ingredientsLoading } = trpc.recipes.getRecipeIngredients.useQuery({
    recipeId: id,
  });
  const { data: shoppingLists } = trpc.shoppingLists.list.useQuery();

  const toggleFavorite = trpc.recipes.toggleFavorite.useMutation({
    onSuccess: () => {
      utils.recipes.getById.invalidate({ id });
      utils.recipes.list.invalidate();
    },
  });

  const deleteRecipe = trpc.recipes.delete.useMutation({
    onSuccess: () => {
      navigation.goBack();
      utils.recipes.list.invalidate();
    },
  });

  const { data: searchResults } = trpc.messages.searchUsers.useQuery(
    { query: searchQuery },
    { enabled: shareModalVisible && searchQuery.length > 0 }
  );

  const shareRecipeMutation = trpc.messages.shareRecipe.useMutation({
    onSuccess: () => {
      Alert.alert("Success", "Recipe shared successfully!");
      setShareModalVisible(false);
      setSearchQuery("");
      setSelectedRecipient(null);
    },
    onError: (error) => {
      Alert.alert("Error", error.message || "Failed to share recipe");
    },
  });

  const addToShoppingListMutation = trpc.shoppingLists.addFromRecipe.useMutation({
    onSuccess: (data: any) => {
      Alert.alert(
        "Success",
        `Added ${data.ingredientsAdded} ingredient${data.ingredientsAdded > 1 ? 's' : ''} to shopping list`,
        [{ text: "OK" }]
      );
      utils.shoppingLists.list.invalidate();
    },
    onError: (error) => {
      Alert.alert("Error", error.message || "Failed to add ingredients to shopping list");
    },
  });

  const createListMutation = trpc.shoppingLists.create.useMutation({
    onSuccess: (data: any) => {
      utils.shoppingLists.list.invalidate();
      const newListId = data.insertId || data.id;
      if (newListId) {
        addToShoppingListMutation.mutate({
          shoppingListId: newListId,
          recipeId: id,
        });
      }
    },
    onError: (error) => {
      Alert.alert("Error", error.message || "Failed to create shopping list");
    },
  });

  const handleDelete = () => {
    Alert.alert("Delete Recipe", "Are you sure you want to delete this recipe?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteRecipe.mutate({ id }),
      },
    ]);
  };

  // Helper function to clean ingredient name (remove "Ingredient:" prefix and normalize)
  const cleanIngredientName = (name: string): string => {
    if (!name || typeof name !== "string") return "";

    let cleaned = name.trim();

    // Remove "Ingredient:" or "Ingredient " prefix (case-insensitive, with optional colon)
    cleaned = cleaned.replace(/^Ingredient:\s*/i, "");
    cleaned = cleaned.replace(/^Ingredient\s+/i, "");

    // Remove common prefixes that might appear
    cleaned = cleaned.replace(/^ing:\s*/i, "");
    cleaned = cleaned.replace(/^ingredient\s*:\s*/i, "");

    // If the cleaned name is just "Ingredient" or empty, return empty string
    if (cleaned.toLowerCase() === "ingredient" || cleaned.length === 0) {
      return "";
    }

    // Clean up extra whitespace (multiple spaces, tabs, etc.)
    cleaned = cleaned.replace(/\s+/g, " ").trim();

    return cleaned;
  };

  // Get ingredients from either the junction table OR the JSONB column
  const ingredientItems = useMemo(() => {
    // First try the junction table (for manually created recipes)
    if (recipeIngredients && recipeIngredients.length > 0) {
      return recipeIngredients.map((ing: any) => ({
        id: String(ing.id || ing.ingredientId),
        name: cleanIngredientName(ing.name || ing.ingredientName || "Ingredient"),
        quantity: ing.quantity,
        unit: ing.unit,
        category: ing.category,
      }));
    }
    // Fall back to JSONB ingredients column (for imported recipes)
    const jsonbIngredients = recipe?.ingredients;
    if (jsonbIngredients && Array.isArray(jsonbIngredients)) {
      const mapped = jsonbIngredients.map((ing: any, idx: number) => {
        const rawName = ing.raw || ing.ingredient || ing.name || String(ing);
        const cleanedName = cleanIngredientName(rawName);
        return {
          id: String(idx),
          name: cleanedName,
          quantity: ing.quantity || ing.quantity_float || null,
          unit: ing.unit || null,
        };
      });
      return mapped;
    }
    return [];
  }, [recipeIngredients, recipe?.ingredients]);

  // Parse recipe steps from instructions TEXT or steps JSONB
  const instructionSteps = useMemo(() => {
    // First try the instructions text field
    if (recipe?.instructions) {
      return recipe.instructions
        .split(/\n+/)
        .map((step) => step.trim())
        .filter(Boolean);
    }
    // Fall back to JSONB steps column (for imported recipes)
    const jsonbSteps = recipe?.steps;
    if (jsonbSteps && Array.isArray(jsonbSteps)) {
      return jsonbSteps.map((step: string) => {
        if (typeof step === 'string') return step;
        return String(step);
      });
    }
    return [];
  }, [recipe?.instructions, recipe?.steps]);

  const handleShare = async () => {
    if (!recipe) return;
    // Show options: Share via messaging or native share
    Alert.alert(
      "Share Recipe",
      "How would you like to share this recipe?",
      [
        {
          text: "Share via Message",
          onPress: () => setShareModalVisible(true),
        },
        {
          text: "Share Externally",
          onPress: async () => {
            try {
              await Share.share({
                title: recipe.name,
                message: `${recipe.name}\n${recipe.description ?? ""}`,
              });
            } catch {
              Alert.alert("Unable to share", "Something went wrong while sharing this recipe.");
            }
          },
        },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  const handleShareToUser = (recipientId: number) => {
    if (!recipe) return;
    shareRecipeMutation.mutate({
      recipeId: recipe.id,
      recipientId,
      message: `Check out this recipe: ${recipe.name}`,
    });
  };

  const handleStartCooking = () => {
    if (!instructionSteps.length) {
      Alert.alert("No instructions", "Add instructions to start cooking mode.");
      return;
    }
    setCookingModeVisible(true);
  };

  const handleAddToShoppingList = () => {
    if (!recipe) return;

    // Check if there are ingredients to add
    if (ingredientItems.length === 0) {
      Alert.alert("No Ingredients", "This recipe doesn't have any ingredients to add.");
      return;
    }

    // If user has shopping lists, show selection dialog
    if (shoppingLists && shoppingLists.length > 0) {
      Alert.alert(
        "Add to Shopping List",
        "Choose a shopping list or create a new one",
        [
          {
            text: "Create New List",
            onPress: () => {
              const listName = `Shopping list for ${recipe.name}`;
              createListMutation.mutate({ name: listName });
            },
          },
          ...shoppingLists.slice(0, 3).map((list: any) => ({
            text: list.name,
            onPress: () => {
              addToShoppingListMutation.mutate({
                shoppingListId: list.id,
                recipeId: id,
              });
            },
          })),
          {
            text: "Cancel",
            style: "cancel" as const,
          },
        ]
      );
    } else {
      // No shopping lists exist, auto-create one
      Alert.alert(
        "Create Shopping List",
        `Create a shopping list for ${recipe.name}?`,
        [
          {
            text: "Create",
            onPress: () => {
              const listName = `Shopping list for ${recipe.name}`;
              createListMutation.mutate({ name: listName });
            },
          },
          {
            text: "Cancel",
            style: "cancel" as const,
          },
        ]
      );
    }
  };


  if (isLoading || !recipe) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.olive} />
      </View>
    );
  }

  const isFavorite = normalizeIsFavorite(recipe.isFavorite);

  // Calculate bottom padding to account for fixed bottom buttons AND tab bar
  // Button height: 64px + container padding: 32px (16px top + 16px bottom) = 96px
  // Tab bar height: ~70px (padding: 4px + item padding: 16px + label: 12px + margins: 16px + safe area)
  // Safe area bottom + large safety margin to prevent cutoff
  const tabBarHeight = 70; // Approximate tab bar height (padding + items + labels + margins)
  const actionButtonsHeight = 64 + 32; // Button height + container padding
  const safetyMargin = 140; // Large safety margin to ensure content is never cut off
  const bottomPadding = actionButtonsHeight + tabBarHeight + insets.bottom + safetyMargin;

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}
        contentInsetAdjustmentBehavior="automatic"
      >
        <View style={styles.heroWrapper}>
          {(() => {
            const imageUri = resolveImageUrl(recipe.imageUrl);
            return imageUri ? (
              <Image
                source={{ uri: imageUri }}
                style={styles.heroImage}
                contentFit="cover"
                transition={200}
                onError={(error) => {
                  console.error("[RecipeDetail] Image load error:", error, "URL:", imageUri);
                }}
              />
            ) : (
              <View style={styles.heroPlaceholder}>
                <Ionicons name="restaurant" size={48} color={colors.olive} />
              </View>
            );
          })()}
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <GlassCard style={styles.firstCard}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{recipe.name}</Text>
            <View style={styles.titleActions}>
              <TouchableOpacity
                onPress={() => {
                  const nextFavoriteState = !isFavorite;
                  toggleFavorite.mutate({ id, isFavorite: nextFavoriteState });
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name={isFavorite ? "heart" : "heart-outline"}
                  size={26}
                  color={isFavorite ? colors.russet : colors.text.secondary}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleShare}>
                <Ionicons name="share-social-outline" size={22} color={colors.text.primary} />
              </TouchableOpacity>
            </View>
          </View>
          {recipe.description ? (
            <Text style={styles.description}>{recipe.description}</Text>
          ) : (
            <Text style={styles.descriptionMuted}>No description available.</Text>
          )}
          <View style={styles.metaRow}>
            {recipe.cuisine ? (
              <View style={styles.metaPill}>
                <Ionicons name="globe-outline" size={16} color={colors.olive} />
                <Text style={styles.metaPillText}>{recipe.cuisine}</Text>
              </View>
            ) : null}
            {recipe.category ? (
              <View style={styles.metaPill}>
                <Ionicons name="pricetag-outline" size={16} color={colors.olive} />
                <Text style={styles.metaPillText}>{recipe.category}</Text>
              </View>
            ) : null}
            {recipe.servings != null && recipe.servings > 0 ? (
              <View style={styles.metaPill}>
                <Ionicons name="people-outline" size={16} color={colors.olive} />
                <Text style={styles.metaPillText}>{recipe.servings} servings</Text>
              </View>
            ) : null}
            {recipe.cookingTime != null && recipe.cookingTime > 0 ? (
              <View style={styles.metaPill}>
                <Ionicons name="time-outline" size={16} color={colors.olive} />
                <Text style={styles.metaPillText}>{recipe.cookingTime} min</Text>
              </View>
            ) : null}
          </View>
        </GlassCard>

        <GlassCard style={styles.contentCard}>
          <Text style={styles.sectionTitle}>Ingredients</Text>
          {ingredientsLoading ? (
            <View>
              <LoadingSkeleton height={16} />
              <LoadingSkeleton height={16} width="60%" />
            </View>
          ) : ingredientItems.length > 0 ? (
            <IngredientList items={ingredientItems} />
          ) : (
            <Text style={styles.placeholder}>No ingredients recorded.</Text>
          )}
        </GlassCard>

        <GlassCard style={styles.contentCard}>
          <Text style={styles.sectionTitle}>Instructions</Text>
          {instructionSteps.length > 0 ? (
            <CookingSteps
              steps={instructionSteps}
              onStepPress={() => {
                setCookingModeVisible(true);
              }}
            />
          ) : (
            <Text style={styles.placeholder}>Add instructions to begin cooking.</Text>
          )}
        </GlassCard>

        {recipe.tags && Array.isArray(recipe.tags) && recipe.tags.length > 0 && (
          <GlassCard style={styles.contentCard}>
            <RecipeTags tags={recipe.tags} />
          </GlassCard>
        )}

        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={18} color="#fff" />
          <Text style={styles.deleteButtonText}>
            {deleteRecipe.isPending ? "Deleting..." : "Delete Recipe"}
          </Text>
        </TouchableOpacity>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>

      <View style={styles.bottomActions}>
        <GradientButton
          title="Add to Shopping List"
          variant="secondary"
          onPress={handleAddToShoppingList}
          disabled={ingredientItems.length === 0 || addToShoppingListMutation.isPending || createListMutation.isPending}
          style={styles.bottomButton}
          textStyle={styles.bottomButtonText}
          numberOfLines={2}
        />
        <GradientButton
          title="Start Cooking"
          onPress={handleStartCooking}
          disabled={!instructionSteps.length}
          style={styles.bottomButton}
          textStyle={styles.bottomButtonText}
          numberOfLines={2}
        />
      </View>

      <CookingModeScreen
        visible={cookingModeVisible}
        steps={instructionSteps}
        onClose={() => setCookingModeVisible(false)}
      />

      {/* Share Recipe Modal */}
      {shareModalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Share Recipe</Text>
              <TouchableOpacity onPress={() => setShareModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.searchInput}
              placeholder="Search users..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
            />

            {searchQuery.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>Start typing to search for users</Text>
              </View>
            ) : searchResults && searchResults.length > 0 ? (
              <FlatList
                data={searchResults}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.userItem}
                    onPress={() => {
                      setSelectedRecipient(item.id);
                      handleShareToUser(item.id);
                    }}
                    disabled={shareRecipeMutation.isPending}
                  >
                    <View style={styles.userAvatar}>
                      <Text style={styles.userAvatarText}>
                        {(item.name || item.email || "U")[0].toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>{item.name || item.email || "Unknown"}</Text>
                      {item.email && item.name && (
                        <Text style={styles.userEmail}>{item.email}</Text>
                      )}
                    </View>
                    {shareRecipeMutation.isPending && selectedRecipient === item.id ? (
                      <ActivityIndicator size="small" color={colors.olive} />
                    ) : (
                      <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
                    )}
                  </TouchableOpacity>
                )}
                style={styles.userList}
              />
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No users found</Text>
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  heroWrapper: {
    width,
    height: 320,
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: colors.glass.background,
    justifyContent: "center",
    alignItems: "center",
  },
  backButton: {
    position: "absolute",
    top: spacing.lg,
    left: spacing.lg,
    backgroundColor: "rgba(0,0,0,0.4)",
    padding: spacing.sm,
    borderRadius: borderRadius.full,
  },
  firstCard: {
    marginHorizontal: spacing.md,
    marginTop: -spacing.xl,
  },
  contentCard: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.navy,
  },
  titleActions: {
    flexDirection: "row",
    gap: spacing.md,
  },
  description: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  descriptionMuted: {
    color: colors.text.tertiary,
    marginTop: spacing.sm,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.glass.background,
  },
  metaPillText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.sm,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.navy,
    marginBottom: spacing.sm,
  },
  placeholder: {
    color: colors.text.secondary,
    fontStyle: "italic",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.russet,
  },
  deleteButtonText: {
    color: colors.text.inverse,
    fontWeight: typography.fontWeight.semibold,
    fontSize: typography.fontSize.md,
  },
  bottomActions: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    alignItems: "stretch",
  },
  bottomButton: {
    flex: 1,
    minHeight: 64,
    height: 64,
    alignSelf: "stretch",
    overflow: "hidden",
  },
  bottomButtonText: {
    textAlign: "center",
  },
  sheetTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.md,
  },
  stepCounter: {
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  currentStep: {
    fontSize: typography.fontSize.lg,
    lineHeight: 24,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  sheetButtons: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  sheetButton: {
    flex: 1,
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    width: width * 0.9,
    maxHeight: "80%",
    padding: spacing.lg,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.navy,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: colors.glass.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
  },
  userList: {
    maxHeight: 400,
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
    backgroundColor: colors.glass.background,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: colors.olive + "20",
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  userAvatarText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.olive,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  userEmail: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  emptyState: {
    padding: spacing.xl,
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
  },
});

export default RecipeDetailScreen;
