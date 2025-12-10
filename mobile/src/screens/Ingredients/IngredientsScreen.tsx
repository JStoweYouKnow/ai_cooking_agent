import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  LayoutAnimation,
  UIManager,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { trpc } from "../../api/trpc";
import GlassCard from "../../components/GlassCard";
import SearchBar from "../../components/SearchBar";
import GradientButton from "../../components/GradientButton";
import LoadingSkeleton from "../../components/LoadingSkeleton";
import EmptyState from "../../components/EmptyState";
import { colors, spacing, typography, borderRadius } from "../../styles/theme";
import AppLayout from "../../components/layout/AppLayout";
import ScreenHeader from "../../components/layout/ScreenHeader";

type ViewMode = "grid" | "list";
type Tab = "manual" | "camera";

interface EnrichedIngredient {
  id: number;
  ingredientId: number;
  name: string;
  category?: string | null;
  quantity?: string | null;
  unit?: string | null;
  imageUrl?: string | null;
}

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const IngredientsScreen: React.FC = () => {
  const utils = trpc.useUtils();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("manual");
  const [newIngredient, setNewIngredient] = useState({
    name: "",
    quantity: "",
    unit: "",
    category: "",
  });
  const [selectedImage, setSelectedImage] = useState<{ uri: string; base64?: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);

  const {
    data: userIngredients,
    isLoading: pantryLoading,
  } = trpc.ingredients.getUserIngredients.useQuery();
  const { data: allIngredients } = trpc.ingredients.list.useQuery();

  const getOrCreateMutation = trpc.ingredients.getOrCreate.useMutation({
    onSuccess: () => {
      // Invalidate ingredients list to ensure new ingredient is available for lookup
      utils.ingredients.list.invalidate();
    },
  });
  const addToUserListMutation = trpc.ingredients.addToUserList.useMutation({
    onSuccess: () => {
      utils.ingredients.getUserIngredients.invalidate();
      // Also invalidate ingredients list to ensure consistency
      utils.ingredients.list.invalidate();
    },
  });
  const removeFromUserListMutation = trpc.ingredients.removeFromUserList.useMutation({
    onMutate: async ({ id }) => {
      await utils.ingredients.getUserIngredients.cancel();
      const previous = utils.ingredients.getUserIngredients.getData();
      if (previous) {
        utils.ingredients.getUserIngredients.setData(
          undefined,
          previous.filter((item: any) => item.id !== id)
        );
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        utils.ingredients.getUserIngredients.setData(undefined, context.previous);
      }
    },
    onSettled: () => utils.ingredients.getUserIngredients.invalidate(),
  });
  const uploadImageMutation = trpc.ingredients.uploadImage.useMutation();
  const recognizeFromImageMutation = trpc.ingredients.recognizeFromImage.useMutation();

  const enrichedIngredients: EnrichedIngredient[] = useMemo(() => {
    if (!userIngredients || !allIngredients) return [];
    const map = new Map(allIngredients.map((ing: any) => [ing.id, ing]));
    return userIngredients.map((item: any) => {
      const ingredient = map.get(item.ingredientId);
      return {
        id: item.id,
        ingredientId: item.ingredientId,
        name: ingredient?.name ?? "Unknown",
        category: ingredient?.category,
        quantity: item.quantity,
        unit: item.unit,
        imageUrl: ingredient?.imageUrl,
      };
    });
  }, [userIngredients, allIngredients]);

  const filteredIngredients = useMemo(() => {
    if (!searchQuery.trim()) return enrichedIngredients;
    return enrichedIngredients.filter((ing) =>
      ing.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
    );
  }, [enrichedIngredients, searchQuery]);
  const handleViewModeChange = (mode: ViewMode) => {
    if (mode === viewMode) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setViewMode(mode);
  };


  const groupedByCategory = useMemo(() => {
    const groups: Record<string, EnrichedIngredient[]> = {};
    filteredIngredients.forEach((ingredient) => {
      const key = ingredient.category || "Other";
      if (!groups[key]) groups[key] = [];
      groups[key].push(ingredient);
    });
    return groups;
  }, [filteredIngredients]);

  const resetForm = () => {
    setNewIngredient({ name: "", quantity: "", unit: "", category: "" });
    setSelectedImage(null);
    setActiveTab("manual");
  };

  const handleAddManualIngredient = async () => {
    if (!newIngredient.name.trim()) {
      Alert.alert("Missing name", "Ingredient name is required.");
      return;
    }

    try {
      setIsSaving(true);
      const ingredient = await getOrCreateMutation.mutateAsync({
        name: newIngredient.name.trim(),
        category: newIngredient.category.trim() || undefined,
      });
      await addToUserListMutation.mutateAsync({
        ingredientId: ingredient.id,
        quantity: newIngredient.quantity.trim() || undefined,
        unit: newIngredient.unit.trim() || undefined,
      });
      Alert.alert("Success", `${newIngredient.name.trim()} added to your pantry.`);
      resetForm();
      setIsAddModalVisible(false);
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Unable to add ingredient right now.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async (id: number) => {
    try {
      setRemovingId(id);
      await removeFromUserListMutation.mutateAsync({ id });
      Alert.alert("Removed", "Ingredient removed from your pantry.");
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to remove ingredient.");
    } finally {
      setRemovingId(null);
    }
  };

  const pickImage = async (fromCamera: boolean) => {
    try {
      // Request permissions first
      if (fromCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permission needed",
            "Camera access is required to capture ingredients. Please enable it in your device settings.",
            [{ text: "OK" }]
          );
          return;
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permission needed",
            "Media library access is required to select images. Please enable it in your device settings.",
            [{ text: "OK" }]
          );
          return;
        }
      }

      // Launch image picker
      const result = fromCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
            base64: true,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
            base64: true,
          });

      if (result.canceled) {
        console.log("[IngredientsScreen] User canceled image picker");
        return;
      }

      if (!result.assets || result.assets.length === 0) {
        Alert.alert("Error", "No image was selected. Please try again.");
        return;
      }

      const asset = result.assets[0];
      if (!asset.uri) {
        Alert.alert("Error", "Couldn't access the image. Please try again.");
        return;
      }

      // base64 is optional, but we need it for recognition
      if (!asset.base64) {
        console.warn("[IngredientsScreen] Image selected but base64 not available, will try to upload URI");
      }

      setSelectedImage({ 
        uri: asset.uri, 
        base64: asset.base64 || undefined 
      });
      
      console.log("[IngredientsScreen] Image selected successfully:", {
        uri: asset.uri.substring(0, 50) + "...",
        hasBase64: !!asset.base64,
      });
    } catch (error: any) {
      console.error("[IngredientsScreen] Image picker error:", error);
      Alert.alert(
        "Error",
        error?.message || "Failed to pick image. Please make sure the camera and storage permissions are enabled.",
        [{ text: "OK" }]
      );
    }
  };

  const handleRecognizeFromImage = async () => {
    if (!selectedImage?.base64) {
      Alert.alert("Select an image", "Capture or select an ingredient photo first.");
      return;
    }

    try {
      setIsRecognizing(true);
      const upload = await uploadImageMutation.mutateAsync({
        imageData: selectedImage.base64,
        fileName: `ingredient-${Date.now()}.jpg`,
        contentType: "image/jpeg",
      });
      const recognized = await recognizeFromImageMutation.mutateAsync({ imageUrl: upload.url });
      if (!recognized.length) {
        Alert.alert("No ingredients found", "Try a clearer photo.");
        return;
      }

      // Handle both old format (array of strings) and new format (array of objects)
      for (const item of recognized) {
        let name: string | undefined;
        
        // Extract name with proper type checking
        if (typeof item === 'string') {
          name = item;
        } else if (item && typeof item === 'object') {
          // Ensure name is a string, not an object
          const nameValue = item.name;
          if (typeof nameValue === 'string') {
            name = nameValue;
          } else if (nameValue != null) {
            // Try to convert to string if it's not null/undefined
            name = String(nameValue);
          }
        }
        
        // Skip if name is invalid
        if (!name || typeof name !== 'string' || !name.trim()) {
          console.warn('[IngredientsScreen] Skipping invalid ingredient:', item, 'extracted name:', name);
          continue;
        }
        
        const trimmedName = name.trim();
        
        // Double-check it's still valid after trimming
        if (trimmedName.length === 0 || trimmedName.length > 255) {
          console.warn('[IngredientsScreen] Skipping ingredient with invalid name length:', trimmedName);
          continue;
        }
        
        // Handle empty strings - convert to undefined for optional fields
        const quantity = typeof item === 'object' && item.quantity && typeof item.quantity === 'string' && item.quantity.trim() 
          ? item.quantity.trim() 
          : undefined;
        const unit = typeof item === 'object' && item.unit && typeof item.unit === 'string' && item.unit.trim() 
          ? item.unit.trim() 
          : undefined;
        
        try {
          // Final safety check - ensure trimmedName is definitely a string
          if (typeof trimmedName !== 'string') {
            console.error('[IngredientsScreen] FATAL: trimmedName is not a string:', typeof trimmedName, trimmedName, 'item:', item);
            continue;
          }
          
          // Create a clean object with only string values
          const apiPayload = { 
            name: String(trimmedName) // Force string conversion as final safety
          };
          
          console.log('[IngredientsScreen] Calling getOrCreate with payload:', apiPayload);
          const ingredient = await getOrCreateMutation.mutateAsync(apiPayload);
          
          console.log('[IngredientsScreen] getOrCreate returned:', {
            id: ingredient.id,
            name: ingredient.name,
            category: ingredient.category
          });
          
          if (!ingredient || !ingredient.id) {
            console.error('[IngredientsScreen] Invalid ingredient returned from getOrCreate:', ingredient);
            continue;
          }
          
          await addToUserListMutation.mutateAsync({ 
            ingredientId: ingredient.id,
            quantity: quantity,
            unit: unit,
          });
          
          console.log('[IngredientsScreen] Successfully added ingredient to user list:', ingredient.name);
        } catch (error: any) {
          console.error(`[IngredientsScreen] Failed to add ingredient "${trimmedName}":`, error);
          // Continue with next ingredient instead of failing completely
        }
      }
      Alert.alert("Success", `Added ${recognized.length} ingredient(s) from the photo.`);
      resetForm();
      setIsAddModalVisible(false);
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to recognize ingredients.");
    } finally {
      setIsRecognizing(false);
    }
  };

  const handleAdjustQuantity = async (item: EnrichedIngredient, delta: number) => {
    const currentQty = parseFloat(item.quantity || "0") || 0;
    const newQty = Math.max(0, currentQty + delta);
    if (newQty === 0) {
      handleRemove(item.id);
      return;
    }
    try {
      await removeFromUserListMutation.mutateAsync({ id: item.id });
      await addToUserListMutation.mutateAsync({
        ingredientId: item.ingredientId,
        quantity: newQty.toString(),
        unit: item.unit || undefined,
      });
    } catch (error: any) {
      Alert.alert("Error", error?.message || "Failed to update quantity.");
    }
  };

  const renderIngredientCard = ({ item }: { item: EnrichedIngredient }) => (
    <GlassCard style={styles.ingredientCard}>
      <View style={styles.cardRow}>
        <View style={styles.ingredientAvatar}>
          <Text style={styles.ingredientAvatarText}>{item.name[0]?.toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1, paddingRight: spacing.sm }}>
          <Text style={styles.ingredientName} numberOfLines={2} ellipsizeMode="tail">{item.name}</Text>
          <View style={styles.quantityRow}>
            <View style={styles.quantityControls}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => handleAdjustQuantity(item, -1)}
                accessibilityRole="button"
                accessibilityLabel="Decrease quantity"
              >
                <Ionicons name="remove" size={16} color={colors.text.primary} />
              </TouchableOpacity>
              <Text style={styles.quantityText}>
                {[item.quantity, item.unit].filter(Boolean).join(" ") || "No quantity"}
              </Text>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => handleAdjustQuantity(item, 1)}
                accessibilityRole="button"
                accessibilityLabel="Increase quantity"
              >
                <Ionicons name="add" size={16} color={colors.text.primary} />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.ingredientCategory}>{item.category || "Uncategorized"}</Text>
        </View>
        <TouchableOpacity onPress={() => handleRemove(item.id)} disabled={removingId === item.id}>
          {removingId === item.id ? (
            <ActivityIndicator size="small" color={colors.olive} />
          ) : (
            <Ionicons name="trash-outline" size={20} color={colors.russet} />
          )}
        </TouchableOpacity>
      </View>
    </GlassCard>
  );

  const renderListView = () => (
    <View style={{ gap: spacing.lg }}>
      {Object.entries(groupedByCategory).map(([category, items]) => (
        <View key={category}>
          <Text style={styles.categoryTitle}>{category}</Text>
          <FlatList
            data={items}
            scrollEnabled={false}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <GlassCard style={styles.listCard}>
                <View style={styles.listRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ingredientName}>{item.name}</Text>
                    <View style={styles.quantityRow}>
                      <View style={styles.quantityControls}>
                        <TouchableOpacity
                          style={styles.quantityButton}
                          onPress={() => handleAdjustQuantity(item, -1)}
                          accessibilityRole="button"
                          accessibilityLabel="Decrease quantity"
                        >
                          <Ionicons name="remove" size={14} color={colors.text.primary} />
                        </TouchableOpacity>
                        <Text style={styles.quantityText}>
                          {[item.quantity, item.unit].filter(Boolean).join(" ") || "No quantity"}
                        </Text>
                        <TouchableOpacity
                          style={styles.quantityButton}
                          onPress={() => handleAdjustQuantity(item, 1)}
                          accessibilityRole="button"
                          accessibilityLabel="Increase quantity"
                        >
                          <Ionicons name="add" size={14} color={colors.text.primary} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => handleRemove(item.id)}>
                    <Ionicons name="trash-outline" size={20} color={colors.russet} />
                  </TouchableOpacity>
                </View>
              </GlassCard>
            )}
          />
        </View>
      ))}
    </View>
  );

  const renderGridView = () => (
    <FlatList
      data={filteredIngredients}
      keyExtractor={(item) => item.id.toString()}
      numColumns={1}
      contentContainerStyle={{ paddingBottom: spacing.xxl, gap: spacing.sm }}
      renderItem={renderIngredientCard}
      ListEmptyComponent={
        !pantryLoading && (
          <EmptyState
            title="No ingredients"
            description="Add items manually or use the camera to populate your pantry."
            primaryActionLabel="Add Ingredient"
            onPrimaryAction={() => setIsAddModalVisible(true)}
          />
        )
      }
    />
  );

  return (
    <AppLayout style={styles.screen}>
      <View style={styles.body}>
        <ScreenHeader
          title="My Pantry"
          subtitle={`${enrichedIngredients.length} ingredients tracked`}
          actionLabel="Add"
          onActionPress={() => setIsAddModalVisible(true)}
          showSearch
        />

        <View style={styles.viewToggle}>
          <TouchableOpacity
            onPress={() => handleViewModeChange("grid")}
            accessibilityRole="button"
            accessibilityLabel="Switch to grid view"
          >
            <Ionicons
              name="grid-outline"
              size={22}
              color={viewMode === "grid" ? colors.olive : colors.text.secondary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleViewModeChange("list")}
            accessibilityRole="button"
            accessibilityLabel="Switch to list view"
          >
            <Ionicons
              name="list-outline"
              size={22}
              color={viewMode === "list" ? colors.olive : colors.text.secondary}
            />
          </TouchableOpacity>
        </View>

        <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder="Search pantry..." />

        {pantryLoading ? (
          <View style={styles.loadingWrapper}>
            <LoadingSkeleton height={120} />
            <LoadingSkeleton height={120} />
          </View>
        ) : viewMode === "grid" ? (
          renderGridView()
        ) : (
          <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }}>
            {renderListView()}
          </ScrollView>
        )}
      </View>

      <TouchableOpacity style={styles.fab} onPress={() => setIsAddModalVisible(true)}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <Modal animationType="slide" transparent visible={isAddModalVisible} onRequestClose={() => setIsAddModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Ingredient</Text>
              <TouchableOpacity onPress={() => setIsAddModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.tabRow}>
              <TouchableOpacity
                style={[styles.tabButton, activeTab === "manual" && styles.tabButtonActive]}
                onPress={() => setActiveTab("manual")}
              >
                <Text style={[styles.tabText, activeTab === "manual" && styles.tabTextActive]}>Manual</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabButton, activeTab === "camera" && styles.tabButtonActive]}
                onPress={() => setActiveTab("camera")}
              >
                <Text style={[styles.tabText, activeTab === "camera" && styles.tabTextActive]}>Camera / AI</Text>
              </TouchableOpacity>
            </View>

            {activeTab === "manual" ? (
              <ScrollView contentContainerStyle={{ gap: spacing.sm }}>
                <TextInput
                  placeholder="Ingredient name *"
                  value={newIngredient.name}
                  onChangeText={(text) => setNewIngredient((prev) => ({ ...prev, name: text }))}
                  style={styles.input}
                />
                <View style={styles.row}>
                  <TextInput
                    placeholder="Quantity"
                    value={newIngredient.quantity}
                    onChangeText={(text) => setNewIngredient((prev) => ({ ...prev, quantity: text }))}
                    style={[styles.input, styles.halfInput]}
                  />
                  <TextInput
                    placeholder="Unit"
                    value={newIngredient.unit}
                    onChangeText={(text) => setNewIngredient((prev) => ({ ...prev, unit: text }))}
                    style={[styles.input, styles.halfInput]}
                  />
                </View>
                <TextInput
                  placeholder="Category"
                  value={newIngredient.category}
                  onChangeText={(text) => setNewIngredient((prev) => ({ ...prev, category: text }))}
                  style={styles.input}
                />
                <GradientButton
                  title={isSaving ? "Adding..." : "Add Ingredient"}
                  onPress={handleAddManualIngredient}
                  disabled={isSaving}
                  style={{ marginTop: spacing.md }}
                />
              </ScrollView>
            ) : (
              <View style={{ gap: spacing.md }}>
                {selectedImage ? (
                  <Image source={{ uri: selectedImage.uri }} style={styles.previewImage} />
                ) : (
                  <View style={styles.previewPlaceholder}>
                    <Ionicons name="image-outline" size={32} color={colors.text.secondary} />
                    <Text style={styles.previewText}>Capture or select an ingredient photo</Text>
                  </View>
                )}
                <View style={styles.row}>
                  <GradientButton
                    title="Camera"
                    onPress={() => pickImage(true)}
                    style={[styles.cameraButton, styles.halfButton]}
                  />
                  <GradientButton
                    title="Library"
                    variant="secondary"
                    onPress={() => pickImage(false)}
                    style={[styles.cameraButton, styles.halfButton]}
                  />
                </View>
                <GradientButton
                  title={isRecognizing ? "Recognizing..." : "Recognize Ingredients"}
                  onPress={handleRecognizeFromImage}
                  disabled={isRecognizing}
                  style={{ marginTop: spacing.md }}
                />
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "transparent",
  },
  body: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },
  viewToggle: {
    flexDirection: "row",
    gap: spacing.md,
    alignSelf: "flex-end",
    marginBottom: spacing.md,
  },
  loadingWrapper: {
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  ingredientCard: {
    width: "100%",
    marginBottom: spacing.sm,
    minHeight: 100,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  ingredientAvatar: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: colors.glass.background,
    justifyContent: "center",
    alignItems: "center",
  },
  ingredientAvatarText: {
    fontWeight: typography.fontWeight.bold,
    color: colors.navy,
  },
  ingredientName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  ingredientMeta: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
  },
  ingredientCategory: {
    color: colors.text.tertiary,
    fontSize: typography.fontSize.xs,
    marginTop: 2,
  },
  categoryTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.navy,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  listCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  listRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  quantityRow: {
    marginTop: spacing.xs,
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.glass.background,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.glass.border,
  },
  quantityText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    minWidth: 60,
    textAlign: "center",
  },
  fab: {
    position: "absolute",
    bottom: spacing.xl,
    right: spacing.xl,
    backgroundColor: colors.olive,
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    ...{
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 6,
    },
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    maxHeight: "90%",
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
    color: colors.text.primary,
  },
  tabRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tabButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.glass.background,
    alignItems: "center",
  },
  tabButtonActive: {
    backgroundColor: colors.olive,
  },
  tabText: {
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium,
  },
  tabTextActive: {
    color: colors.text.inverse,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.glass.border,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    color: colors.text.primary,
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  halfInput: {
    flex: 1,
  },
  previewImage: {
    width: "100%",
    height: 180,
    borderRadius: borderRadius.md,
  },
  previewPlaceholder: {
    borderWidth: 1,
    borderColor: colors.glass.border,
    borderRadius: borderRadius.md,
    height: 180,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  previewText: {
    color: colors.text.secondary,
  },
  cameraButton: {
    flex: 1,
  },
  halfButton: {
    flex: 1,
  },
});

export default IngredientsScreen;
