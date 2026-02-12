import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  TextInput,
  Alert,
  Linking,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { RecipeStackScreenProps } from "../../navigation/types";
import { trpc } from "../../api/trpc";
import GlassCard from "../../components/GlassCard";
import SearchBar from "../../components/SearchBar";
import GradientButton from "../../components/GradientButton";
import LoadingSkeleton from "../../components/LoadingSkeleton";
import EmptyState from "../../components/EmptyState";
import BottomSheet from "../../components/BottomSheet";
import RecipeGrid from "../../components/RecipeGrid";
import SearchResultsGrid from "../../components/SearchResultsGrid";
import PaywallPrompt from "../../components/PaywallPrompt";
import { colors, spacing, typography, borderRadius } from "../../styles/theme";
import { useSubscription } from "../../hooks/useSubscription";
import {
  PREMIUM_FEATURES,
  formatUsageMessage,
  getRemainingUsage,
} from "../../utils/premiumFeatures";
import { recordUrlImportAndCheckPaywall } from "../../utils/usagePaywall";
import { CREATOR_CONFIG } from "../../constants/creator";
import { addBreadcrumb } from "../../utils/analytics";

type Props = RecipeStackScreenProps<"RecipeList">;
type SourceOption = "TheMealDB" | "Epicurious" | "Delish" | "NYTCooking";

interface ExternalRecipe {
  id: string;
  title: string;
  imageUrl?: string | null;
  source: SourceOption | string;
  externalId?: string;
  url?: string;
}

const SOURCE_OPTIONS: SourceOption[] = ["TheMealDB", "Epicurious", "Delish", "NYTCooking"];

const RecipeListScreen: React.FC<Props> = ({ navigation }) => {
  const utils = trpc.useUtils();
  const { isPremium, checkPremiumFeature, freeTierLimits } = useSubscription();
  const [searchIngredients, setSearchIngredients] = useState<string[]>([]);
  const [currentIngredient, setCurrentIngredient] = useState("");
  const [selectedSources, setSelectedSources] = useState<SourceOption[]>(["TheMealDB"]);
  const [searchResults, setSearchResults] = useState<ExternalRecipe[]>([]);
  const [visibleCount, setVisibleCount] = useState(12);
  const [hasSearched, setHasSearched] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [urlSheetVisible, setUrlSheetVisible] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [urlError, setUrlError] = useState<string>("");
  const [savingRecipeId, setSavingRecipeId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"recent" | "alphabetical" | "meal">("recent");
  const [mealFilter, setMealFilter] = useState<"breakfast" | "lunch" | "dinner" | "dessert" | null>(null);
  const [collectionFilter, setCollectionFilter] = useState<string | null>(null);
  const [sortSheetVisible, setSortSheetVisible] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  // Ensure we stay on RecipeList when the screen is focused
  // This prevents auto-navigation to RecipeDetail
  useFocusEffect(
    React.useCallback(() => {
      // Reset any navigation state that might have been preserved
      // This ensures we always show RecipeList when the Recipes tab is focused
      return () => {
        // Cleanup if needed
      };
    }, [])
  );

  const { data: collections } = trpc.recipes.getCollections.useQuery();
  const { data: savedRecipes, isLoading: savedRecipesLoading, isError: savedRecipesError, refetch: refetchSavedRecipes } = trpc.recipes.list.useQuery({
    sortBy,
    mealFilter: mealFilter || undefined,
    collection: collectionFilter || undefined,
  });
  const { data: userIngredients } = trpc.ingredients.getUserIngredients.useQuery();
  const { data: allIngredients } = trpc.ingredients.list.useQuery();

  // Premium feature checks
  const savedRecipesCount = savedRecipes?.length || 0;
  const canSaveRecipe = checkPremiumFeature(
    PREMIUM_FEATURES.UNLIMITED_RECIPES,
    savedRecipesCount,
    freeTierLimits.RECIPES_SAVED
  );
  const canImportFromUrl = checkPremiumFeature(
    PREMIUM_FEATURES.UNLIMITED_IMPORTS,
    undefined,
    undefined
  );

  const searchMutation = trpc.recipes.searchByIngredients.useMutation();
  const parseFromUrlMutation = trpc.recipes.parseFromUrl.useMutation({
    onSuccess: () => utils.recipes.list.invalidate(),
  });
  const importFromTheMealDBMutation = trpc.recipes.importFromTheMealDB.useMutation({
    onSuccess: () => utils.recipes.list.invalidate(),
  });

  const pantryIngredientNames = useMemo(() => {
    if (!userIngredients || !allIngredients) return [];
    const ingredientMap = new Map(allIngredients.map((ing: any) => [ing.id, ing.name]));
    return userIngredients
      .map((item: any) => ingredientMap.get(item.ingredientId))
      .filter((name): name is string => Boolean(name));
  }, [userIngredients, allIngredients]);

  const displayedResults = searchResults.slice(0, visibleCount);
  const isSearching = searchMutation.isPending;

  const handleAddIngredient = () => {
    const trimmed = currentIngredient.trim();
    if (!trimmed) {
      Alert.alert("Add Ingredient", "Please enter an ingredient name.");
      return;
    }
    if (searchIngredients.length >= 5) {
      Alert.alert("Limit Reached", "You can add up to 5 ingredients.");
      return;
    }
    if (searchIngredients.includes(trimmed.toLowerCase())) {
      Alert.alert("Duplicate", "This ingredient is already in your list.");
      return;
    }
    setSearchIngredients((prev) => [...prev, trimmed.toLowerCase()]);
    setCurrentIngredient("");
  };

  const handleRemoveIngredient = (ingredient: string) => {
    setSearchIngredients((prev) => prev.filter((ing) => ing !== ingredient));
  };

  const handleUseMyPantry = () => {
    if (!pantryIngredientNames.length) {
      Alert.alert("Pantry Empty", "Add ingredients to your pantry before using this shortcut.");
      return;
    }
    setSearchIngredients(pantryIngredientNames.slice(0, 5).map((name) => name.toLowerCase()));
  };

  const normalizeResults = (results: any[]): ExternalRecipe[] =>
    (results || []).map((item, index) => {
      const title = item.strMeal || item.title || item.name || "Untitled Recipe";
      const imageUrl = item.strMealThumb || item.imageUrl || item.thumbnail || null;
      const externalId = item.idMeal || item.id || `${item.source || "external"}-${index}`;
      return {
        id: String(externalId),
        title,
        imageUrl,
        source: (item.source || "TheMealDB") as SourceOption,
        externalId: item.idMeal ? String(item.idMeal) : item.id ? String(item.id) : undefined,
        url: item.url || item.sourceUrl || undefined,
      };
    });

  const handleSearch = async () => {
    if (searchIngredients.length === 0) {
      Alert.alert("Add Ingredients", "Add at least one ingredient to search.");
      return;
    }
    if (selectedSources.length === 0) {
      Alert.alert("Select Sources", "Choose at least one recipe source.");
      return;
    }

    setHasSearched(true);
    setVisibleCount(12);

    try {
      const data = await searchMutation.mutateAsync({
        ingredients: searchIngredients,
        sources: selectedSources,
      });
      setSearchResults(normalizeResults(data));
    } catch (error: any) {
      Alert.alert("Search Failed", error?.message || "Unable to search recipes right now.");
    }
  };

  const handleLoadMoreResults = () => {
    if (visibleCount < searchResults.length) {
      setVisibleCount((prev) => prev + 10);
    }
  };

  const handleToggleSource = (source: SourceOption) => {
    setSelectedSources((prev) =>
      prev.includes(source) ? prev.filter((item) => item !== source) : [...prev, source]
    );
  };

  const handleSaveRecipe = async (recipe: ExternalRecipe) => {
    if (savingRecipeId) return;

    // Check premium status before saving
    if (!canSaveRecipe) {
      setShowPaywall(true);
      return;
    }

    setSavingRecipeId(recipe.id);
    try {
      if (recipe.source === "TheMealDB" && recipe.externalId) {
        await importFromTheMealDBMutation.mutateAsync({ mealId: recipe.externalId });
        Alert.alert("Success", "Recipe saved to your collection.");
      } else if (recipe.url) {
        // Check if URL import requires premium
        if (!canImportFromUrl) {
          Alert.alert(
            "Premium Feature",
            "Importing recipes from URLs is a Premium feature. Upgrade to unlock unlimited imports.",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Upgrade",
                onPress: () => navigation.navigate("More" as never, { screen: "Subscription" } as never),
              },
            ]
          );
          setSavingRecipeId(null);
          return;
        }
        console.log("[RecipeList] Saving recipe from URL:", recipe.url);
        await parseFromUrlMutation.mutateAsync({ url: recipe.url, autoSave: true });
        console.log("[RecipeList] Recipe saved successfully");
        Alert.alert("Imported", "Recipe imported and saved.");
      } else {
        Alert.alert("Not Supported", "This source can't be imported automatically yet.");
      }
    } catch (error: any) {
      console.error("[RecipeList] Save recipe failed:", {
        message: error?.message,
        data: error?.data,
        recipeUrl: recipe.url,
      });
      
      let errorMessage = error?.message || "Failed to save recipe.";
      
      // Provide more helpful error messages
      if (errorMessage.includes("Network request failed") || errorMessage.includes("timeout")) {
        errorMessage = "Unable to connect to the server. Please check your internet connection.";
      } else if (errorMessage.includes("Failed to parse recipe from URL")) {
        // Server now provides detailed error messages
        errorMessage = errorMessage;
      }
      
      Alert.alert("Error", errorMessage);
    } finally {
      setSavingRecipeId(null);
    }
  };

  const validateUrl = (url: string): { valid: boolean; error?: string } => {
    const trimmedUrl = url.trim();

    // Check URL length (prevent abuse)
    if (trimmedUrl.length > 2048) {
      return { valid: false, error: "URL is too long" };
    }

    try {
      const parsed = new URL(trimmedUrl);

      // Only allow http and https protocols
      if (!["http:", "https:"].includes(parsed.protocol)) {
        return { valid: false, error: "Only HTTP and HTTPS URLs are supported" };
      }

      return { valid: true };
    } catch {
      return { valid: false, error: "Enter a valid URL" };
    }
  };

  const handleImportFromUrl = async () => {
    // Check premium status for URL imports
    if (!canImportFromUrl) {
      Alert.alert(
        "Premium Feature",
        "Importing recipes from URLs is a Premium feature. Upgrade to unlock this feature.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Upgrade",
            onPress: () => {
              setUrlSheetVisible(false);
              navigation.navigate("More" as never, { screen: "Subscription" } as never);
            },
          },
        ]
      );
      return;
    }

    if (!importUrl.trim()) {
      setUrlError("Please enter a recipe URL");
      return;
    }
    const validation = validateUrl(importUrl);
    if (!validation.valid) {
      setUrlError(validation.error || "Enter a valid URL");
      return;
    }
    setUrlError("");
    try {
      console.log("[RecipeList] Importing recipe from URL:", importUrl.trim());
      await parseFromUrlMutation.mutateAsync({ url: importUrl.trim(), autoSave: true });
      addBreadcrumb("import", "Recipe imported from URL", { urlLength: importUrl.trim().length });
      console.log("[RecipeList] Recipe imported successfully");
      Alert.alert("Imported", "Recipe imported successfully.");
      setImportUrl("");
      setUrlSheetVisible(false);
      const { showPaywall: shouldShow } = await recordUrlImportAndCheckPaywall(isPremium);
      if (shouldShow) setShowPaywall(true);
    } catch (error: any) {
      console.error("[RecipeList] Import failed - Full error object:", error);
      console.error("[RecipeList] Import failed - Error message:", error?.message);
      console.error("[RecipeList] Import failed - Error data:", error?.data);
      console.error("[RecipeList] Import failed - Error cause:", error?.cause);
      console.error("[RecipeList] Import failed - Error shape:", {
        message: error?.message,
        data: error?.data,
        httpStatus: error?.data?.httpStatus,
        code: error?.data?.code,
        path: error?.data?.path,
        cause: error?.cause,
      });
      
      // Extract error message - try multiple sources
      let errorMessage = error?.message || "Unable to import this recipe.";
      
      // If it's a TRPC error, the message should be in error.message
      // But sometimes the detailed message might be in error.data or error.cause
      if (error?.data?.message) {
        errorMessage = error.data.message;
      } else if (error?.cause?.message) {
        errorMessage = error.cause.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      // Provide more helpful error messages
      if (errorMessage.includes("Network request failed") || errorMessage.includes("timeout")) {
        errorMessage = "Unable to connect to the server. Please check your internet connection.";
      } else if (errorMessage === "Failed to parse recipe from URL") {
        // If we still have the generic message, try to get more details
        if (error?.data?.httpStatus === 500) {
          errorMessage = "Server error while parsing recipe. The URL may be invalid or the website may be blocking access.";
        } else {
          errorMessage = "Failed to parse recipe from URL. Please check that the URL is a valid recipe page.";
        }
      }
      
      Alert.alert("Import Failed", errorMessage);
    }
  };

  const openAIAssistant = () => {
    navigation.getParent()?.navigate("Settings" as never, { screen: "AIAssistant" } as never);
  };

  const openRecipeGenerator = () => {
    navigation.getParent()?.navigate("Settings" as never, { screen: "RecipeGenerator" } as never);
  };

  const renderIngredientChips = () => (
    <View style={styles.chipsContainer} accessible={true} accessibilityLabel="Selected ingredients">
      {searchIngredients.map((ingredient) => (
        <View key={ingredient} style={styles.chip}>
          <Text style={styles.chipText}>{ingredient}</Text>
          <TouchableOpacity
            onPress={() => handleRemoveIngredient(ingredient)}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${ingredient}`}
            accessibilityHint="Double tap to remove this ingredient from search"
          >
            <Text style={styles.removeChip}>×</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Recipe Discovery</Text>
        <Text style={styles.subtitle}>
          Combine pantry ingredients, explore premium sources, or import recipes by URL.
        </Text>

        {/* Premium Usage Indicator */}
        {!isPremium && (
          <GlassCard style={styles.usageCard}>
            <View style={styles.usageRow}>
              <Ionicons name="information-circle" size={20} color={colors.olive} />
              <Text style={styles.usageText}>
                {formatUsageMessage(savedRecipesCount, freeTierLimits.RECIPES_SAVED, "recipes")}
              </Text>
            </View>
            {savedRecipesCount >= freeTierLimits.RECIPES_SAVED && (
              <GradientButton
                title="Upgrade to Premium"
                onPress={() => navigation.navigate("More" as never, { screen: "Subscription" } as never)}
                variant="olive"
                style={styles.upgradeButtonSmall}
              />
            )}
          </GlassCard>
        )}

        {/* Premium Badge for URL Import */}
        {!canImportFromUrl && (
          <GlassCard style={styles.premiumBadgeCard}>
            <View style={styles.premiumBadgeRow}>
              <Ionicons name="lock-closed" size={16} color={colors.olive} />
              <Text style={styles.premiumBadgeText}>
                Import from URL is a Premium feature
              </Text>
            </View>
          </GlassCard>
        )}

        <GlassCard style={[styles.card, styles.aiCard]}>
          <Text style={styles.sectionTitle}>Need inspiration?</Text>
          <Text style={styles.aiBody}>
            Use Sous AI to brainstorm dishes or instantly generate a recipe tailored to the ingredients you have on
            hand.
          </Text>
          <View style={styles.aiActions}>
            <GradientButton title="Generate Recipe" onPress={openRecipeGenerator} style={styles.flexButton} />
            <GradientButton
              title="Ask Sous"
              variant="secondary"
              onPress={openAIAssistant}
              style={styles.flexButton}
            />
          </View>
        </GlassCard>

        <GlassCard style={styles.card}>
          <SearchBar
            value={currentIngredient}
            onChangeText={setCurrentIngredient}
            placeholder="Add an ingredient (max 5)"
            showFiltersButton
            onFiltersPress={() => setFiltersVisible(true)}
            onSubmitEditing={handleAddIngredient}
          />
          <View style={styles.quickRow}>
            <GradientButton title="Add Ingredient" onPress={handleAddIngredient} style={styles.flexButton} />
            <GradientButton
              title="Use My Pantry"
              onPress={handleUseMyPantry}
              variant="secondary"
              style={styles.flexButton}
            />
          </View>
          {searchIngredients.length > 0 && renderIngredientChips()}
          <GradientButton
            title={isSearching ? "Searching..." : "Search Recipes"}
            onPress={handleSearch}
            disabled={isSearching}
            style={styles.searchButton}
          />
        </GlassCard>

        <GlassCard style={styles.card}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickActions}
            style={styles.quickActionsScrollView}
          >
            <Pressable
              style={({ pressed }) => [styles.quickActionItem, pressed && styles.quickActionItemPressed]}
              onPress={() => setUrlSheetVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="Import recipe from URL"
            >
              <View style={styles.quickActionContent}>
                <Ionicons name="link" size={22} color={colors.olive} />
                <Text style={styles.quickActionText}>Import from URL</Text>
                {!canImportFromUrl && (
                  <Ionicons name="lock-closed" size={14} color={colors.olive} style={styles.lockIcon} />
                )}
              </View>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.quickActionItem, pressed && styles.quickActionItemPressed]}
              onPress={() => navigation.navigate("CreateRecipe")}
              accessibilityRole="button"
              accessibilityLabel="Create recipe manually"
            >
              <Ionicons name="create" size={22} color={colors.russet} />
              <Text style={styles.quickActionText}>Create Recipe</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.quickActionItem, pressed && styles.quickActionItemPressed]}
              onPress={() => navigation.navigate("PantryGenerator")}
              accessibilityRole="button"
              accessibilityLabel="Cook with what you have"
            >
              <Ionicons name="camera" size={22} color={colors.olive} />
              <Text style={styles.quickActionText}>Cook with Pantry</Text>
            </Pressable>
          </ScrollView>
        </GlassCard>

        <View style={styles.sourcesWrapper}>
          <Text style={styles.sectionTitle}>Sources</Text>
          <View style={styles.sourcesRow} accessible={true} accessibilityLabel="Recipe sources">
            {SOURCE_OPTIONS.map((source) => (
              <TouchableOpacity
                key={source}
                style={[
                  styles.sourceChip,
                  selectedSources.includes(source) && styles.sourceChipSelected,
                ]}
                onPress={() => handleToggleSource(source)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selectedSources.includes(source) }}
                accessibilityLabel={`${source} recipe source`}
                accessibilityHint={selectedSources.includes(source) ? "Double tap to deselect" : "Double tap to select"}
              >
                <Text
                  style={[
                    styles.sourceChipText,
                    selectedSources.includes(source) && styles.sourceChipTextSelected,
                  ]}
                >
                  {source}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.resultsSection}>
          <Text style={styles.sectionTitle}>Search Results</Text>
          {isSearching && (
            <View style={styles.skeletonGrid}>
              {Array.from({ length: 4 }).map((_, idx) => (
                <GlassCard key={idx} style={styles.resultSkeleton}>
                  <LoadingSkeleton width="100%" height={150} borderRadiusOverride={borderRadius.lg} />
                  <LoadingSkeleton width="80%" height={16} />
                  <LoadingSkeleton width="40%" height={14} />
                </GlassCard>
              ))}
            </View>
          )}
          {!isSearching && hasSearched && searchResults.length === 0 && (
            <EmptyState
              title="No recipes found"
              description="Try adding different ingredients or include more sources."
              primaryActionLabel="Adjust Filters"
              onPrimaryAction={() => setFiltersVisible(true)}
            />
          )}
          {!isSearching && searchResults.length > 0 && (
            <View>
              <Text style={styles.resultsMeta}>
                Showing {displayedResults.length} of {searchResults.length} recipes
              </Text>
              <SearchResultsGrid
                results={displayedResults}
                onSaveRecipe={handleSaveRecipe}
                savingRecipeId={savingRecipeId}
                scrollEnabled={false}
              />
              {visibleCount < searchResults.length && (
                <GradientButton title="Load more results" onPress={handleLoadMoreResults} style={styles.loadMore} />
              )}
            </View>
          )}
        </View>

        <View style={styles.savedSection}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Your Recipes</Text>
              {!isPremium && savedRecipesCount > 0 && (
                <Text style={styles.usageSubtext}>
                  {savedRecipesCount} / {freeTierLimits.RECIPES_SAVED} saved
                </Text>
              )}
            </View>
            <TouchableOpacity
              onPress={() => setSortSheetVisible(true)}
              style={styles.sortButton}
              accessibilityRole="button"
              accessibilityLabel="Sort and filter recipes"
              accessibilityHint="Opens sort and filter options"
            >
              <Ionicons name="options-outline" size={20} color={colors.olive} />
              <Text style={styles.sortButtonText}>Sort</Text>
            </TouchableOpacity>
          </View>
          {(mealFilter || collectionFilter) && (
            <View style={styles.filterChipRow}>
              {mealFilter && (
                <View style={styles.filterChip}>
                  <Text style={styles.filterChipText}>
                    {mealFilter.charAt(0).toUpperCase() + mealFilter.slice(1)}
                  </Text>
                  <TouchableOpacity onPress={() => setMealFilter(null)}>
                    <Ionicons name="close-circle" size={18} color={colors.text.secondary} />
                  </TouchableOpacity>
                </View>
              )}
              {collectionFilter && (
                <View style={styles.filterChip}>
                  <Text style={styles.filterChipText}>Collection: {collectionFilter}</Text>
                  <TouchableOpacity onPress={() => setCollectionFilter(null)}>
                    <Ionicons name="close-circle" size={18} color={colors.text.secondary} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
          {savedRecipesLoading ? (
            <View style={styles.skeletonGrid}>
              {Array.from({ length: 4 }).map((_, idx) => (
                <LoadingSkeleton key={`saved-${idx}`} width="100%" height={120} borderRadiusOverride={borderRadius.lg} />
              ))}
            </View>
          ) : savedRecipesError ? (
            <EmptyState
              variant="error"
              title="Couldn't load recipes"
              description="Check your connection and try again."
              primaryActionLabel="Retry"
              onPrimaryAction={() => refetchSavedRecipes()}
            />
          ) : savedRecipes && savedRecipes.length > 0 ? (
            <RecipeGrid
              recipes={savedRecipes}
              onSelect={(recipe) => navigation.navigate("RecipeDetail", { id: recipe.id })}
              scrollEnabled={false}
            />
          ) : (
            <EmptyState
              title="No saved recipes yet"
              description="Import or create recipes to build your collection."
              primaryActionLabel="Create Recipe"
              onPrimaryAction={() => navigation.navigate("CreateRecipe")}
            />
          )}
        </View>
      </ScrollView>

      <BottomSheet visible={filtersVisible} onClose={() => setFiltersVisible(false)} snapHeight={0.4}>
        <Text style={styles.sheetTitle}>Recipe Sources</Text>
        <View style={styles.sheetSources}>
          {SOURCE_OPTIONS.map((source) => (
            <TouchableOpacity
              key={`sheet-${source}`}
              style={[
                styles.sourceChip,
                selectedSources.includes(source) && styles.sourceChipSelected,
              ]}
              onPress={() => handleToggleSource(source)}
            >
              <Text
                style={[
                  styles.sourceChipText,
                  selectedSources.includes(source) && styles.sourceChipTextSelected,
                ]}
              >
                {source}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <GradientButton title="Done" onPress={() => setFiltersVisible(false)} />
      </BottomSheet>

      <BottomSheet visible={sortSheetVisible} onClose={() => setSortSheetVisible(false)} snapHeight={0.6}>
        <Text style={styles.sheetTitle}>Sort & Filter Recipes</Text>
        
        <View style={styles.sortSection}>
          <Text style={styles.sortSectionTitle}>Sort By</Text>
          <TouchableOpacity
            style={[styles.sortOption, sortBy === "recent" && styles.sortOptionSelected]}
            onPress={() => setSortBy("recent")}
          >
            <Ionicons
              name={sortBy === "recent" ? "radio-button-on" : "radio-button-off"}
              size={20}
              color={sortBy === "recent" ? colors.olive : colors.text.secondary}
            />
            <Text style={[styles.sortOptionText, sortBy === "recent" && styles.sortOptionTextSelected]}>
              Most Recent
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortOption, sortBy === "alphabetical" && styles.sortOptionSelected]}
            onPress={() => setSortBy("alphabetical")}
          >
            <Ionicons
              name={sortBy === "alphabetical" ? "radio-button-on" : "radio-button-off"}
              size={20}
              color={sortBy === "alphabetical" ? colors.olive : colors.text.secondary}
            />
            <Text style={[styles.sortOptionText, sortBy === "alphabetical" && styles.sortOptionTextSelected]}>
              Alphabetically (A-Z)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortOption, sortBy === "meal" && styles.sortOptionSelected]}
            onPress={() => setSortBy("meal")}
          >
            <Ionicons
              name={sortBy === "meal" ? "radio-button-on" : "radio-button-off"}
              size={20}
              color={sortBy === "meal" ? colors.olive : colors.text.secondary}
            />
            <Text style={[styles.sortOptionText, sortBy === "meal" && styles.sortOptionTextSelected]}>
              By Meal Type
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sortSection}>
          <Text style={styles.sortSectionTitle}>Filter by Meal</Text>
          <View style={styles.mealFilterRow}>
            {(["breakfast", "lunch", "dinner", "dessert"] as const).map((meal) => (
              <TouchableOpacity
                key={meal}
                style={[
                  styles.mealFilterChip,
                  mealFilter === meal && styles.mealFilterChipSelected,
                ]}
                onPress={() => setMealFilter(mealFilter === meal ? null : meal)}
              >
                <Text
                  style={[
                    styles.mealFilterChipText,
                    mealFilter === meal && styles.mealFilterChipTextSelected,
                  ]}
                >
                  {meal.charAt(0).toUpperCase() + meal.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.sortSection}>
          <Text style={styles.sortSectionTitle}>Collection</Text>
          <View style={styles.mealFilterRow}>
            <TouchableOpacity
              style={[
                styles.mealFilterChip,
                !collectionFilter && styles.mealFilterChipSelected,
              ]}
              onPress={() => setCollectionFilter(null)}
            >
              <Text
                style={[
                  styles.mealFilterChipText,
                  !collectionFilter && styles.mealFilterChipTextSelected,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            {(collections || []).map((name) => (
              <TouchableOpacity
                key={name}
                style={[
                  styles.mealFilterChip,
                  collectionFilter === name && styles.mealFilterChipSelected,
                ]}
                onPress={() => setCollectionFilter(collectionFilter === name ? null : name)}
              >
                <Text
                  style={[
                    styles.mealFilterChipText,
                    collectionFilter === name && styles.mealFilterChipTextSelected,
                  ]}
                >
                  {name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <GradientButton title="Apply" onPress={() => setSortSheetVisible(false)} />
      </BottomSheet>

      <BottomSheet visible={urlSheetVisible} onClose={() => setUrlSheetVisible(false)} snapHeight={0.65}>
        <Text style={styles.sheetTitle}>Import Recipe from URL</Text>
        {!canImportFromUrl && (
          <PaywallPrompt
            feature="URL Import"
            message="Importing recipes from URLs is a Premium feature. Upgrade to unlock unlimited imports."
            variant="inline"
            onUpgrade={() => {
              setUrlSheetVisible(false);
              navigation.navigate("More" as never, { screen: "Subscription" } as never);
            }}
          />
        )}
        <TextInput
          value={importUrl}
          onChangeText={(text) => {
            setImportUrl(text);
            if (urlError) setUrlError("");
          }}
          placeholder="https://example.com/recipe"
          style={[styles.urlInput, urlError && styles.urlInputError, !canImportFromUrl && styles.urlInputDisabled]}
          autoCapitalize="none"
          keyboardType="url"
          editable={canImportFromUrl}
        />
        {urlError ? <Text style={styles.errorText}>{urlError}</Text> : null}
        <GradientButton
          title={parseFromUrlMutation.isPending ? "Importing..." : "Import Recipe"}
          onPress={handleImportFromUrl}
          disabled={parseFromUrlMutation.isPending || !canImportFromUrl}
        />
      </BottomSheet>

      {/* Paywall Modal */}
      {showPaywall && (
        <PaywallPrompt
          feature="Recipe Saves"
          currentUsage={savedRecipesCount}
          limit={freeTierLimits.RECIPES_SAVED}
          variant="modal"
          showClose={true}
          onClose={() => setShowPaywall(false)}
          onUpgrade={() => {
            setShowPaywall(false);
            navigation.navigate("More" as never, { screen: "Subscription" } as never);
          }}
          creatorName={CREATOR_CONFIG.name}
          creatorEndorsement={CREATOR_CONFIG.endorsement}
        />
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
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  title: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.navy,
  },
  subtitle: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  card: {
    marginBottom: spacing.lg,
  },
  aiCard: {
    gap: spacing.sm,
  },
  aiBody: {
    color: colors.text.secondary,
  },
  aiActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  quickRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  flexButton: {
    flex: 1,
  },
  searchButton: {
    marginTop: spacing.md,
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.glass.background,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.glass.border,
  },
  chipText: {
    color: colors.text.primary,
    marginRight: spacing.xs,
  },
  removeChip: {
    color: colors.error,
    fontSize: typography.fontSize.lg,
  },
  quickActionsScrollView: {
    marginTop: spacing.md,
  },
  quickActions: {
    flexDirection: "row",
    gap: spacing.md,
    paddingRight: spacing.md,
  },
  quickActionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    minWidth: 120,
  },
  quickActionItemPressed: {
    transform: [{ scale: 0.97 }],
  },
  quickActionText: {
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium,
  },
  sourcesWrapper: {
    marginBottom: spacing.lg,
  },
  sourcesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  sourceChip: {
    borderWidth: 1,
    borderColor: colors.glass.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  sourceChipSelected: {
    backgroundColor: colors.olive,
    borderColor: colors.olive,
  },
  sourceChipText: {
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium,
  },
  sourceChipTextSelected: {
    color: colors.text.inverse,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.navy,
  },
  resultsSection: {
    marginBottom: spacing.xl,
  },
  resultsMeta: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  skeletonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  resultSkeleton: {
    width: "48%",
  },
  loadMore: {
    marginTop: spacing.md,
  },
  savedSection: {
    marginBottom: spacing.xl,
  },
  sheetTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.md,
    color: colors.text.primary,
  },
  sheetSources: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  urlInput: {
    borderWidth: 1,
    borderColor: colors.glass.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    color: colors.text.primary,
  },
  urlInputError: {
    borderColor: colors.error,
  },
  errorText: {
    color: colors.error,
    marginBottom: spacing.sm,
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.glass.border,
  },
  sortButtonText: {
    fontSize: typography.fontSize.sm,
    color: colors.olive,
    fontWeight: typography.fontWeight.medium,
  },
  filterChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.olive + "20",
    borderRadius: borderRadius.full,
    alignSelf: "flex-start",
  },
  filterChipText: {
    fontSize: typography.fontSize.sm,
    color: colors.olive,
    fontWeight: typography.fontWeight.medium,
  },
  sortSection: {
    marginBottom: spacing.lg,
  },
  sortSectionTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.navy,
    marginBottom: spacing.md,
  },
  sortOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
  },
  sortOptionSelected: {
    backgroundColor: colors.olive + "10",
  },
  sortOptionText: {
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
  },
  sortOptionTextSelected: {
    color: colors.olive,
    fontWeight: typography.fontWeight.semibold,
  },
  mealFilterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  mealFilterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.glass.border,
  },
  mealFilterChipSelected: {
    backgroundColor: colors.olive,
    borderColor: colors.olive,
  },
  mealFilterChipText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium,
  },
  mealFilterChipTextSelected: {
    color: colors.text.inverse,
  },
  usageCard: {
    marginBottom: spacing.md,
  },
  usageRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  usageText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    flex: 1,
  },
  upgradeButtonSmall: {
    marginTop: spacing.sm,
  },
  premiumBadgeCard: {
    marginBottom: spacing.md,
    padding: spacing.sm,
  },
  premiumBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  premiumBadgeText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  },
  usageSubtext: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    marginTop: spacing.xs / 2,
  },
  quickActionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  lockIcon: {
    marginLeft: spacing.xs / 2,
  },
  urlInputDisabled: {
    opacity: 0.5,
  },
});

export default RecipeListScreen;
