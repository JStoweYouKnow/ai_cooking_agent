import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, borderRadius, typography } from "../styles/theme";

export interface IngredientItem {
  id: string;
  name: string;
  quantity?: string | null;
  unit?: string | null;
  category?: string | null;
  /** When true, show as "in pantry" (e.g. checkbox pre-checked). */
  inPantry?: boolean;
}

interface IngredientListProps {
  items: IngredientItem[];
  title?: string;
  showCategoryBadges?: boolean;
  onIngredientPress?: (ingredient: IngredientItem) => void;
}

const IngredientList: React.FC<IngredientListProps> = ({ items, title = 'Ingredients', showCategoryBadges, onIngredientPress }) => {
  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      <View style={styles.listContainer}>
        {items.map((item) => {
          const RowComponent = onIngredientPress ? require('react-native').TouchableOpacity : require('react-native').View;
          return (
            <RowComponent
              key={item.id}
              style={styles.row}
              onPress={onIngredientPress ? () => onIngredientPress(item) : undefined}
              disabled={!onIngredientPress}
            >
              {item.inPantry === true ? (
                <View style={styles.pantryCheck}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.olive} />
                  <Text style={styles.pantryLabel}>In pantry</Text>
                </View>
              ) : null}
              <View style={styles.rowText}>
                <Text style={[styles.ingredientName, item.inPantry && styles.ingredientInPantry]} numberOfLines={0}>
                  {[item.quantity, item.unit, item.name].filter(Boolean).join(" ")}
                </Text>
              </View>
              {showCategoryBadges && item.category && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.category}</Text>
                </View>
              )}
            </RowComponent>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.glass.background,
    borderWidth: 1,
    borderColor: colors.glass.border,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.md,
    color: colors.text.primary,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  rowText: {
    flex: 1,
    marginRight: spacing.sm,
    flexShrink: 1,
  },
  pantryCheck: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginRight: spacing.sm,
  },
  pantryLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.olive,
    fontWeight: typography.fontWeight.semibold,
  },
  ingredientInPantry: {
    opacity: 0.85,
  },
  ingredientName: {
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
  },
  listContainer: {
    width: '100%',
  },
  badge: {
    backgroundColor: colors.tan,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  badgeText: {
    fontSize: typography.fontSize.xs,
    color: colors.navy,
    fontWeight: typography.fontWeight.semibold,
  },
});

export default IngredientList;
