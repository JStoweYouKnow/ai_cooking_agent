import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  Share,
  Linking,
  ScrollView,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import { ShoppingListStackScreenProps } from "../../navigation/types";
import { trpc } from "../../api/trpc";
import GlassCard from "../../components/GlassCard";
import GradientButton from "../../components/GradientButton";
import LoadingSkeleton from "../../components/LoadingSkeleton";
import EmptyState from "../../components/EmptyState";
import SearchBar from "../../components/SearchBar";
import BottomSheet from "../../components/BottomSheet";
import { colors, spacing, typography, borderRadius } from "../../styles/theme";
import { groceryStores, getStoreDeepLink } from "../../utils/groceryStores";
import { groupItemsByCategory, CATEGORY_ICONS, type GroceryCategory } from "../../utils/groceryCategories";

type Props = ShoppingListStackScreenProps<"ShoppingListDetail">;

const ShoppingListDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { id } = route.params;
  const utils = trpc.useUtils();

  const { data: shoppingList, isLoading: listLoading, isError: listError, refetch: refetchList } = trpc.shoppingLists.getById.useQuery({ id });
  const { data: items, isLoading: itemsLoading, isError: itemsError, refetch: refetchItems } = trpc.shoppingLists.getItems.useQuery({ id });
  const { data: ingredients } = trpc.ingredients.list.useQuery();
  const { data: recipes } = trpc.recipes.list.useQuery();

  // Debug: Log items to see their structure
  React.useEffect(() => {
    if (items && items.length > 0) {
      console.log("[ShoppingListDetail] Raw items from server:", JSON.stringify(items[0], null, 2));
    }
  }, [items]);

  const toggleItem = trpc.shoppingLists.toggleItem.useMutation({
    onSuccess: () => utils.shoppingLists.getItems.invalidate({ id }),
    onError: (error) => {
      console.error("[ShoppingListDetail] Toggle item failed:", error);
      Alert.alert("Error", "Failed to update item. Please try again.");
    },
  });
  const removeItem = trpc.shoppingLists.removeItem.useMutation({
    onSuccess: () => utils.shoppingLists.getItems.invalidate({ id }),
    onError: (error) => {
      console.error("[ShoppingListDetail] Remove item failed:", error);
      Alert.alert("Error", "Failed to remove item. Please try again.");
    },
  });
  const addItem = trpc.shoppingLists.addItem.useMutation({
    onSuccess: () => utils.shoppingLists.getItems.invalidate({ id }),
    onError: (error) => {
      console.error("[ShoppingListDetail] Add item failed:", error);
      Alert.alert("Error", "Failed to add item. Please try again.");
    },
  });
  const addFromRecipe = trpc.shoppingLists.addFromRecipe.useMutation({
    onSuccess: () => utils.shoppingLists.getItems.invalidate({ id }),
    onError: (error) => {
      console.error("[ShoppingListDetail] Add from recipe failed:", error);
      Alert.alert("Error", "Failed to add recipe ingredients. Please try again.");
    },
  });
  const updateList = trpc.shoppingLists.update.useMutation({
    onSuccess: () => utils.shoppingLists.getById.invalidate({ id }),
    onError: (error) => {
      console.error("[ShoppingListDetail] Update list failed:", error);
      Alert.alert("Error", "Failed to update list. Please try again.");
    },
  });

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [listName, setListName] = useState("");
  const [listDescription, setListDescription] = useState("");

  const [addSheetVisible, setAddSheetVisible] = useState(false);
  const [ingredientSearch, setIngredientSearch] = useState("");
  const [selectedIngredientId, setSelectedIngredientId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");

  const [recipesSheetVisible, setRecipesSheetVisible] = useState(false);
  const [actionsSheetVisible, setActionsSheetVisible] = useState(false);

  const ingredientOptions = useMemo(() => {
    if (!ingredients) return [];
    return ingredients
      .filter((ing: any) =>
        ing.name.toLowerCase().includes(ingredientSearch.trim().toLowerCase())
      )
      .slice(0, 30);
  }, [ingredients, ingredientSearch]);

  // Create a map of ingredientId to ingredient name
  const ingredientMap = useMemo(() => {
    if (!ingredients) return new Map();
    return new Map(ingredients.map((ing: any) => [ing.id, ing]));
  }, [ingredients]);

  // Enrich items with ingredient names and categories
  const enrichedItems = useMemo(() => {
    if (!items) return [];
    return items.map((item: any) => {
      const ingredient = ingredientMap.get(item.ingredientId);
      if (!ingredient) {
        console.warn(
          `[ShoppingListDetail] Ingredient lookup failed for ingredientId ${item.ingredientId}. ` +
          `Total ingredients in map: ${ingredientMap.size}, ` +
          `Shopping list items: ${items.length}`
        );
      }
      return {
        ...item,
        ingredientName: ingredient?.name || `Ingredient #${item.ingredientId}`,
        category: ingredient?.category || null,
      };
    });
  }, [items, ingredientMap]);

  const activeItems = useMemo(() => enrichedItems.filter((item: any) => !item.isChecked), [enrichedItems]);
  const completedItems = useMemo(() => enrichedItems.filter((item: any) => item.isChecked), [enrichedItems]);

  // Group active items by grocery category
  const groupedActiveItems = useMemo(() => {
    return groupItemsByCategory(activeItems);
  }, [activeItems]);

  // Group completed items by grocery category
  const groupedCompletedItems = useMemo(() => {
    return groupItemsByCategory(completedItems);
  }, [completedItems]);

  const handleToggleItem = (itemId: number, isChecked: boolean) => {
    toggleItem.mutate({ itemId, isChecked: !isChecked });
  };

  const handleRemoveItem = (itemId: number) => {
    Alert.alert("Remove item", "Remove this item from the list?", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => removeItem.mutate({ itemId }) },
    ]);
  };

  const handleAddItem = () => {
    if (!selectedIngredientId) {
      Alert.alert("Select ingredient", "Choose an ingredient to add.");
      return;
    }
    addItem.mutate(
      {
        shoppingListId: id,
        ingredientId: selectedIngredientId,
        quantity: quantity.trim() || undefined,
        unit: unit.trim() || undefined,
      },
      {
        onSuccess: () => {
          setIngredientSearch("");
          setSelectedIngredientId(null);
          setQuantity("");
          setUnit("");
          setAddSheetVisible(false);
        },
      }
    );
  };

  const handleAddFromRecipe = (recipeId: number, name: string) => {
    addFromRecipe.mutate(
      { shoppingListId: id, recipeId },
      {
        onSuccess: () => {
          Alert.alert("Added", `Ingredients from "${name}" were added.`);
          setRecipesSheetVisible(false);
        },
      }
    );
  };

  const handleShareList = async () => {
    if (!shoppingList) return;
    const text =
      `Shopping List: ${shoppingList.name}\n\n` +
      enrichedItems
        .map((item: any) => {
          const name = item.ingredientName || `Ingredient #${item.ingredientId}`;
          const qty = [item.quantity, item.unit].filter(Boolean).join(" ");
          const status = item.isChecked ? "✓" : "•";
          return `${status} ${name}${qty ? ` (${qty})` : ""}`;
        })
        .join("\n");
    await Share.share({ title: shoppingList.name, message: text });
  };

  const handleCopyToClipboard = async () => {
    if (!shoppingList) return;
    const text =
      `Shopping List: ${shoppingList.name}\n\n` +
      enrichedItems
        .map((item: any) => {
          const name = item.ingredientName || `Ingredient #${item.ingredientId}`;
          const qty = [item.quantity, item.unit].filter(Boolean).join(" ");
          const status = item.isChecked ? "✓" : "•";
          return `${status} ${name}${qty ? ` (${qty})` : ""}`;
        })
        .join("\n");
    await Clipboard.setStringAsync(text);
    Alert.alert("Copied", "Shopping list copied to clipboard.");
    setActionsSheetVisible(false);
  };

  const handleExportAsText = async () => {
    if (!shoppingList) return;
    const text =
      `SHOPPING LIST: ${shoppingList.name}\n` +
      `${shoppingList.description ? `Description: ${shoppingList.description}\n` : ""}\n` +
      `Items (${enrichedItems.length}):\n\n` +
      enrichedItems
        .map((item: any, idx: number) => {
          const name = item.ingredientName || `Ingredient #${item.ingredientId}`;
          const qty = [item.quantity, item.unit].filter(Boolean).join(" ");
          return `${idx + 1}. ${name}${qty ? ` - ${qty}` : ""} ${item.isChecked ? "[✓]" : ""}`;
        })
        .join("\n");
    await Share.share({ title: `${shoppingList.name}.txt`, message: text });
  };

  const handleOpenStore = (storeId: string) => {
    const url = getStoreDeepLink(storeId);
    Linking.openURL(url);
  };

  const openEditModal = () => {
    if (!shoppingList) return;
    setListName(shoppingList.name);
    setListDescription(shoppingList.description || "");
    setEditModalVisible(true);
  };

  const submitListUpdate = () => {
    updateList.mutate(
      { id, name: listName.trim() || shoppingList?.name, description: listDescription.trim() || undefined },
      {
        onSuccess: () => setEditModalVisible(false),
      }
    );
  };

  if (listLoading || !shoppingList) {
    if (listError) {
      return (
        <View style={styles.screen}>
          <TouchableOpacity style={styles.backButtonError} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
            <Text style={styles.backButtonErrorText}>Back</Text>
          </TouchableOpacity>
          <EmptyState
            variant="error"
            title="Couldn't load this list"
            description="Check your connection and try again."
            primaryActionLabel="Retry"
            onPrimaryAction={() => refetchList()}
          />
        </View>
      );
    }
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={colors.olive} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>{shoppingList.name}</Text>
            <Text style={styles.subtitle}>{shoppingList.description || "No description"}</Text>
          </View>
          <TouchableOpacity
            onPress={openEditModal}
            accessibilityRole="button"
            accessibilityLabel="Edit shopping list"
            accessibilityHint="Opens edit form for list name and description"
          >
            <Ionicons name="create-outline" size={22} color={colors.text.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.summaryRow}>
          <GlassCard style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Items</Text>
            <Text style={styles.summaryValue}>{enrichedItems.length}</Text>
          </GlassCard>
          <GlassCard style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Remaining</Text>
            <Text style={styles.summaryValue}>{activeItems.length}</Text>
          </GlassCard>
          <GlassCard style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Completed</Text>
            <Text style={styles.summaryValue}>{completedItems.length}</Text>
          </GlassCard>
        </View>

        <View style={styles.actionRow}>
          <GradientButton
            title="Add Item"
            onPress={() => setAddSheetVisible(true)}
            style={styles.actionButton}
          />
          <GradientButton
            title="Add from Recipe"
            variant="secondary"
            onPress={() => setRecipesSheetVisible(true)}
            style={styles.actionButton}
          />
          <TouchableOpacity
            style={styles.moreButton}
            onPress={() => setActionsSheetVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="More actions"
            accessibilityHint="Share, copy, or export shopping list"
          >
            <Ionicons name="ellipsis-horizontal" size={22} color={colors.text.primary} />
          </TouchableOpacity>
        </View>

        <GlassCard style={styles.card}>
          <Text style={styles.sectionTitle}>Items</Text>
          {itemsLoading ? (
            <View style={styles.skeletonWrapper}>
              <LoadingSkeleton height={18} width="80%" />
              <LoadingSkeleton height={18} width="60%" />
            </View>
          ) : activeItems.length === 0 && completedItems.length === 0 ? (
            <EmptyState
              title="No items yet"
              description="Add ingredients to build your shopping list."
              primaryActionLabel="Add Item"
              onPrimaryAction={() => setAddSheetVisible(true)}
            />
          ) : (
            <>
              {activeItems.length > 0 && (
                <View>
                  {Array.from(groupedActiveItems.entries()).map(([category, items]) => (
                    <View key={category} style={styles.categorySection}>
                      <View style={styles.categoryHeader}>
                        <Text style={styles.categoryEmoji}>{CATEGORY_ICONS[category]}</Text>
                        <Text style={styles.categoryTitle}>{category}</Text>
                        <Text style={styles.categoryCount}>({items.length})</Text>
                      </View>
                      {items.map((item: any) => (
                        <View style={styles.itemRow} key={item.id} accessible={true} accessibilityLabel={`${item.ingredientName || "Ingredient"}${item.purchaseQuantity?.displayText ? `, buy ${item.purchaseQuantity.displayText}` : ""}`}>
                          <TouchableOpacity
                            style={styles.checkbox}
                            onPress={() => handleToggleItem(item.id, item.isChecked)}
                            accessibilityRole="checkbox"
                            accessibilityState={{ checked: false }}
                            accessibilityLabel={`Mark ${item.ingredientName || "item"} as complete`}
                          >
                            <Ionicons name="ellipse-outline" size={22} color={colors.olive} />
                          </TouchableOpacity>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.itemName}>{item.ingredientName || "Ingredient"}</Text>
                            {item.purchaseQuantity?.displayText ? (
                              <Text style={styles.itemMeta}>
                                Buy: {item.purchaseQuantity.displayText}
                                {(item.quantity || item.unit) && (
                                  <Text style={styles.itemMetaSecondary}>
                                    {" "}(recipe: {[item.quantity, item.unit].filter(Boolean).join(" ")})
                                  </Text>
                                )}
                              </Text>
                            ) : (item.quantity || item.unit) ? (
                              <Text style={styles.itemMeta}>
                                {[item.quantity, item.unit].filter(Boolean).join(" ")}
                              </Text>
                            ) : null}
                          </View>
                          <TouchableOpacity
                            onPress={() => handleRemoveItem(item.id)}
                            accessibilityRole="button"
                            accessibilityLabel={`Remove ${item.ingredientName || "item"} from list`}
                          >
                            <Ionicons name="trash-outline" size={20} color={colors.russet} />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  ))}
                </View>
              )}
              {completedItems.length > 0 && (
                <View style={{ marginTop: spacing.lg }}>
                  <Text style={styles.completedLabel}>Completed</Text>
                  {Array.from(groupedCompletedItems.entries()).map(([category, items]) => (
                    <View key={`completed-${category}`} style={styles.categorySection}>
                      <View style={styles.categoryHeader}>
                        <Text style={styles.categoryEmoji}>{CATEGORY_ICONS[category]}</Text>
                        <Text style={[styles.categoryTitle, styles.completedText]}>{category}</Text>
                        <Text style={[styles.categoryCount, styles.completedText]}>({items.length})</Text>
                      </View>
                      {items.map((item: any) => (
                        <View style={styles.itemRow} key={`completed-${item.id}`} accessible={true} accessibilityLabel={`${item.ingredientName || "Ingredient"}, completed`}>
                          <TouchableOpacity
                            style={styles.checkbox}
                            onPress={() => handleToggleItem(item.id, item.isChecked)}
                            accessibilityRole="checkbox"
                            accessibilityState={{ checked: true }}
                            accessibilityLabel={`Unmark ${item.ingredientName || "item"} as complete`}
                          >
                            <Ionicons name="checkmark-circle" size={22} color={colors.olive} />
                          </TouchableOpacity>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.itemName, styles.completedText]}>
                              {item.ingredientName || "Ingredient"}
                            </Text>
                            {item.purchaseQuantity?.displayText ? (
                              <Text style={[styles.itemMeta, styles.completedText]}>
                                Buy: {item.purchaseQuantity.displayText}
                                {(item.quantity || item.unit) && (
                                  <Text style={[styles.itemMetaSecondary, styles.completedText]}>
                                    {" "}(recipe: {[item.quantity, item.unit].filter(Boolean).join(" ")})
                                  </Text>
                                )}
                              </Text>
                            ) : (item.quantity || item.unit) ? (
                              <Text style={[styles.itemMeta, styles.completedText]}>
                                {[item.quantity, item.unit].filter(Boolean).join(" ")}
                              </Text>
                            ) : null}
                          </View>
                          <TouchableOpacity
                            onPress={() => handleRemoveItem(item.id)}
                            accessibilityRole="button"
                            accessibilityLabel={`Remove ${item.ingredientName || "item"} from list`}
                          >
                            <Ionicons name="trash-outline" size={20} color={colors.text.tertiary} />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
        </GlassCard>
      </ScrollView>

      <Modal visible={editModalVisible} transparent animationType="fade" onRequestClose={() => setEditModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit List</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.text.primary} />
              </TouchableOpacity>
            </View>
            <TextInput
              value={listName}
              onChangeText={setListName}
              placeholder="List name"
              style={styles.input}
            />
            <TextInput
              value={listDescription}
              onChangeText={setListDescription}
              placeholder="Description"
              style={[styles.input, { height: 80 }]}
              multiline
            />
            <GradientButton
              title={updateList.isPending ? "Saving..." : "Save"}
              onPress={submitListUpdate}
              disabled={updateList.isPending}
              style={{ marginTop: spacing.md }}
            />
          </View>
        </View>
      </Modal>

      <BottomSheet visible={addSheetVisible} onClose={() => setAddSheetVisible(false)} snapHeight={0.75}>
        <Text style={styles.sheetTitle}>Add Ingredient</Text>
        <SearchBar
          value={ingredientSearch}
          onChangeText={setIngredientSearch}
          placeholder="Search ingredients..."
        />
        <View style={styles.ingredientList}>
          {ingredientOptions.map((ingredient: any) => {
            const isSelected = selectedIngredientId === ingredient.id;
            return (
              <TouchableOpacity
                key={ingredient.id}
                style={[styles.ingredientOption, isSelected && styles.ingredientOptionSelected]}
                onPress={() => setSelectedIngredientId(ingredient.id)}
              >
                <Text style={[styles.ingredientOptionText, isSelected && styles.ingredientOptionTextSelected]}>
                  {ingredient.name}
                </Text>
                <Text style={styles.ingredientOptionCategory}>{ingredient.category || "Pantry"}</Text>
              </TouchableOpacity>
            );
          })}
          {ingredientOptions.length === 0 && (
            <Text style={styles.placeholder}>No ingredients found. Try a different search.</Text>
          )}
        </View>
        <View style={styles.row}>
          <TextInput
            placeholder="Quantity"
            value={quantity}
            onChangeText={setQuantity}
            style={[styles.input, styles.halfInput]}
          />
          <TextInput
            placeholder="Unit"
            value={unit}
            onChangeText={setUnit}
            style={[styles.input, styles.halfInput]}
          />
        </View>
        <GradientButton
          title={addItem.isPending ? "Adding..." : "Add to List"}
          onPress={handleAddItem}
          disabled={addItem.isPending}
          style={{ marginTop: spacing.md }}
        />
      </BottomSheet>

      <BottomSheet visible={recipesSheetVisible} onClose={() => setRecipesSheetVisible(false)} snapHeight={0.7}>
        <Text style={styles.sheetTitle}>Import from Recipes</Text>
        {recipes ? (
          <ScrollView style={{ maxHeight: 350 }}>
            {recipes.map((recipe: any) => (
              <TouchableOpacity
                key={recipe.id}
                style={styles.recipeOption}
                onPress={() => handleAddFromRecipe(recipe.id, recipe.name)}
              >
                <View>
                  <Text style={styles.recipeName}>{recipe.name}</Text>
                  <Text style={styles.recipeMeta}>{recipe.cuisine || recipe.category || "Custom"}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.text.secondary} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.skeletonWrapper}>
            <LoadingSkeleton height={16} width="80%" />
            <LoadingSkeleton height={16} width="60%" />
          </View>
        )}
      </BottomSheet>

      <BottomSheet visible={actionsSheetVisible} onClose={() => setActionsSheetVisible(false)} snapHeight={0.8}>
        <Text style={styles.sheetTitle}>Quick Actions</Text>
        <View style={styles.actionButtons}>
          <GradientButton title="Share List" onPress={handleShareList} style={styles.actionSheetButton} />
          <GradientButton
            title="Copy to Clipboard"
            variant="secondary"
            onPress={handleCopyToClipboard}
            style={styles.actionSheetButton}
          />
          <GradientButton
            title="Export as Text"
            variant="secondary"
            onPress={handleExportAsText}
            style={styles.actionSheetButton}
          />
          <GradientButton
            title="Rename List"
            variant="olive"
            onPress={() => {
              setActionsSheetVisible(false);
              openEditModal();
            }}
            style={styles.actionSheetButton}
          />
        </View>
        <Text style={[styles.sectionTitle, { marginTop: spacing.md }]}>Send to Store</Text>
        <ScrollView style={{ maxHeight: 320 }}>
          {groceryStores.map((store) => (
            <TouchableOpacity
              key={store.id}
              style={styles.storeRow}
              onPress={() => handleOpenStore(store.id)}
            >
              <View style={[styles.storeIcon, { backgroundColor: store.accentColor + "22" }]}>
                <Ionicons name="bag-handle-outline" size={18} color={store.accentColor} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.storeName}>{store.name}</Text>
                <Text style={styles.storeDescription}>{store.description}</Text>
              </View>
              <Ionicons name="open-outline" size={18} color={colors.text.secondary} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </BottomSheet>
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
  loadingScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  backButtonError: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    gap: spacing.xs,
  },
  backButtonErrorText: {
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.navy,
  },
  subtitle: {
    color: colors.text.secondary,
  },
  summaryRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  summaryCard: {
    flex: 1,
    alignItems: "center",
  },
  summaryLabel: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
  },
  summaryValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
  },
  actionButton: {
    flex: 1,
  },
  moreButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.glass.background,
  },
  card: {
    margin: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.navy,
    marginBottom: spacing.sm,
  },
  skeletonWrapper: {
    gap: spacing.sm,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  checkbox: {
    padding: spacing.xs,
  },
  itemName: {
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium,
  },
  itemMeta: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
  },
  itemMetaSecondary: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    fontStyle: "italic",
  },
  completedLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  completedText: {
    textDecorationLine: "line-through",
    color: colors.text.tertiary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: "100%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  modalTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.glass.border,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginTop: spacing.sm,
    color: colors.text.primary,
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  halfInput: {
    flex: 1,
  },
  ingredientList: {
    maxHeight: 250,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  ingredientOption: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.glass.border,
    marginBottom: spacing.xs,
  },
  ingredientOptionSelected: {
    backgroundColor: colors.olive,
    borderColor: colors.olive,
  },
  ingredientOptionText: {
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium,
  },
  ingredientOptionTextSelected: {
    color: colors.text.inverse,
  },
  ingredientOptionCategory: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.xs,
  },
  recipeOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.glass.border,
  },
  recipeName: {
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },
  recipeMeta: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
  },
  storeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.glass.border,
  },
  storeIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  storeName: {
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },
  storeDescription: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.xs,
  },
  sheetTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.sm,
    color: colors.text.primary,
  },
  actionButtons: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  actionSheetButton: {
    marginBottom: spacing.xs,
  },
  placeholder: {
    color: colors.text.secondary,
    fontStyle: "italic",
    paddingVertical: spacing.sm,
  },
  categorySection: {
    marginTop: spacing.md,
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
    backgroundColor: colors.glass.background,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
  },
  categoryEmoji: {
    fontSize: typography.fontSize.lg,
    marginRight: spacing.xs,
  },
  categoryTitle: {
    flex: 1,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  categoryCount: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
});

export default ShoppingListDetailScreen;
