import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { trpc } from "../../api/trpc";
import { ShoppingListStackScreenProps } from "../../navigation/types";
import GlassCard from "../../components/GlassCard";
import GradientButton from "../../components/GradientButton";
import LoadingSkeleton from "../../components/LoadingSkeleton";
import { colors, spacing, typography, borderRadius } from "../../styles/theme";

type Props = ShoppingListStackScreenProps<"CreateShoppingList">;

const CreateShoppingListScreen: React.FC<Props> = ({ navigation }) => {
  const utils = trpc.useUtils();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedIngredients, setSelectedIngredients] = useState<number[]>([]);

  const { data: userIngredients, isLoading } = trpc.ingredients.getUserIngredients.useQuery();
  const { data: allIngredients } = trpc.ingredients.list.useQuery();

  const createList = trpc.shoppingLists.create.useMutation({
    onSuccess: () => {
      utils.shoppingLists.list.invalidate();
    },
  });

  const addItem = trpc.shoppingLists.addItem.useMutation({
    onSuccess: () => utils.shoppingLists.getItems.invalidate(),
  });

  const toggleIngredientSelection = (ingredientId: number) => {
    setSelectedIngredients((prev) =>
      prev.includes(ingredientId) ? prev.filter((id) => id !== ingredientId) : [...prev, ingredientId]
    );
  };

  const pantryOptions = useMemo(() => {
    if (!userIngredients || !allIngredients) return [];
    const map = new Map(allIngredients.map((ing: any) => [ing.id, ing]));
    return userIngredients
      .map((entry: any) => ({
        userIngredientId: entry.id,
        ingredientId: entry.ingredientId,
        quantity: entry.quantity,
        unit: entry.unit,
        name: map.get(entry.ingredientId)?.name ?? "Unknown",
        category: map.get(entry.ingredientId)?.category,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [userIngredients, allIngredients]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert("List name required", "Give your shopping list a name.");
      return;
    }

    try {
      const list = await createList.mutateAsync({ name: name.trim(), description: description.trim() || undefined });
      
      // Add selected ingredients to the list
      if (selectedIngredients.length > 0) {
        await Promise.all(
          selectedIngredients.map((ingredientId) => {
            const pantryEntry = pantryOptions.find((ing) => ing.ingredientId === ingredientId);
            return addItem.mutateAsync({
              shoppingListId: list.id,
              ingredientId,
              quantity: pantryEntry?.quantity || undefined,
              unit: pantryEntry?.unit || undefined,
            });
          })
        );
        // Invalidate items query to ensure the detail screen shows the new items
        utils.shoppingLists.getItems.invalidate({ id: list.id });
      }
      
      // Navigate to the detail screen after all items are added
      navigation.replace("ShoppingListDetail", { id: list.id });
    } catch (error: any) {
      console.error("[CreateShoppingList] Error:", error);
      Alert.alert("Error", error?.message || "Unable to create shopping list.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Text style={styles.header}>Create Shopping List</Text>
      <Text style={styles.subheader}>Plan your next grocery run with ease.</Text>

      <GlassCard style={styles.card}>
        <Text style={styles.sectionTitle}>Details</Text>
        <TextInput
          placeholder="List name *"
          value={name}
          onChangeText={setName}
          style={styles.input}
        />
        <TextInput
          placeholder="Description"
          value={description}
          onChangeText={setDescription}
          style={[styles.input, { height: 90 }]}
          multiline
        />
      </GlassCard>

      <GlassCard style={styles.card}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Added from Pantry</Text>
          <Text style={styles.sectionSubtitle}>{selectedIngredients.length} selected</Text>
        </View>
        {isLoading ? (
          <View style={{ gap: spacing.sm }}>
            <LoadingSkeleton height={16} width="70%" />
            <LoadingSkeleton height={16} width="50%" />
          </View>
        ) : pantryOptions.length === 0 ? (
          <Text style={styles.placeholder}>No pantry ingredients yet.</Text>
        ) : (
          pantryOptions.map((ing) => {
            const selected = selectedIngredients.includes(ing.ingredientId);
            return (
              <TouchableOpacity
                key={ing.userIngredientId}
                style={[styles.pantryRow, selected && styles.pantryRowSelected]}
                onPress={() => toggleIngredientSelection(ing.ingredientId)}
              >
                <View style={styles.pantryIcon}>
                  <Text style={styles.pantryIconText}>{ing.name[0]}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pantryName}>{ing.name}</Text>
                  <Text style={styles.pantryMeta}>
                    {[ing.quantity, ing.unit].filter(Boolean).join(" ") || "No quantity"}
                  </Text>
                </View>
                {selected ? (
                  <Ionicons name="checkmark-circle" size={22} color={colors.olive} />
                ) : (
                  <Ionicons name="ellipse-outline" size={22} color={colors.text.tertiary} />
                )}
              </TouchableOpacity>
            );
          })
        )}
      </GlassCard>

      <GradientButton
        title={createList.isPending ? "Creating..." : "Create List"}
        onPress={handleSubmit}
        disabled={createList.isPending}
        style={{ marginTop: spacing.lg }}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
    backgroundColor: colors.cream,
  },
  header: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.navy,
  },
  subheader: {
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },
  card: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.navy,
    marginBottom: spacing.sm,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  sectionSubtitle: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.glass.border,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginTop: spacing.sm,
    color: colors.text.primary,
  },
  placeholder: {
    color: colors.text.secondary,
    fontStyle: "italic",
  },
  pantryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.glass.border,
  },
  pantryRowSelected: {
    backgroundColor: colors.glass.background,
  },
  pantryIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.glass.background,
    justifyContent: "center",
    alignItems: "center",
  },
  pantryIconText: {
    fontWeight: typography.fontWeight.semibold,
    color: colors.navy,
  },
  pantryName: {
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },
  pantryMeta: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
  },
});

export default CreateShoppingListScreen;
