import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../styles/theme';

export interface IngredientItem {
  id: string;
  name: string;
  quantity?: string | null;
  unit?: string | null;
  category?: string | null;
}

interface IngredientListProps {
  items: IngredientItem[];
  title?: string;
  showCategoryBadges?: boolean;
}

const IngredientList: React.FC<IngredientListProps> = ({ items, title = 'Ingredients', showCategoryBadges }) => (
  <View style={styles.container}>
    <Text style={styles.title}>{title}</Text>
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      scrollEnabled={false}
      renderItem={({ item }) => (
        <View style={styles.row}>
          <View style={styles.rowText}>
            <Text style={styles.ingredientName}>{item.name}</Text>
            <Text style={styles.quantity}>
              {[item.quantity, item.unit].filter(Boolean).join(' ')}
            </Text>
          </View>
          {showCategoryBadges && item.category && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.category}</Text>
            </View>
          )}
        </View>
      )}
    />
  </View>
);

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
  },
  ingredientName: {
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
  },
  quantity: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
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



