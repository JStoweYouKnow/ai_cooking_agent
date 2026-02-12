import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../styles/theme';

interface CookingStepsProps {
  steps: string[];
  onStepPress?: (index: number) => void;
}

const CookingSteps: React.FC<CookingStepsProps> = ({ steps, onStepPress }) => (
  <View style={styles.container} accessibilityLabel="Cooking steps" accessible>
    <Text style={styles.title} accessibilityRole="header">Cooking Steps</Text>
    <FlatList
      data={steps}
      keyExtractor={(_, index) => `step-${index}`}
      scrollEnabled={false}
      renderItem={({ item, index }) => (
        <View
          style={styles.stepContainer}
          accessible
          accessibilityLabel={`Step ${index + 1} of ${steps.length}. ${item.trim()}`}
          accessibilityRole="button"
          accessibilityHint={onStepPress ? "Double tap to start cooking mode from this step" : undefined}
        >
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>{index + 1}</Text>
          </View>
          <Text style={styles.stepText} onPress={() => onStepPress?.(index)}>
            {item.trim()}
          </Text>
        </View>
      )}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    ...{
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 3,
    },
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.md,
    color: colors.text.primary,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.olive,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    color: colors.text.inverse,
    fontWeight: typography.fontWeight.bold as any,
  },
  stepText: {
    flex: 1,
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
    lineHeight: typography.fontSize.lg * 1.4,
  },
  separator: {
    height: spacing.sm,
  },
});

export default CookingSteps;



