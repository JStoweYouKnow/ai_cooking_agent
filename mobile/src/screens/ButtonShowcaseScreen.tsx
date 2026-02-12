/**
 * Button Component Showcase
 *
 * Storybook-style preview of all Button variants, sizes, and states.
 * Use this screen to verify consistent styling across the design system.
 */

import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Button, { ButtonVariant, ButtonSize } from "../components/buttons/Button";
import AppLayout from "../components/layout/AppLayout";
import ScreenHeader from "../components/layout/ScreenHeader";
import { colors, spacing, typography } from "../styles/theme";
import type { MoreStackScreenProps } from "../navigation/types";

type Props = MoreStackScreenProps<"ButtonShowcase">;

const VARIANTS: ButtonVariant[] = ["primary", "secondary", "outline", "danger", "ghost"];
const SIZES: ButtonSize[] = ["small", "medium", "large"];

const ButtonShowcaseScreen: React.FC<Props> = ({ navigation }) => {
  const [loadingVariant, setLoadingVariant] = useState<ButtonVariant | null>(null);

  const simulateLoading = (variant: ButtonVariant) => {
    setLoadingVariant(variant);
    setTimeout(() => setLoadingVariant(null), 2000);
  };

  return (
    <AppLayout scrollable contentContainerStyle={styles.container}>
      <ScreenHeader
        title="Button Showcase"
        subtitle="All variants, sizes, and states"
        showBack
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Variants */}
        <Section title="Variants">
          {VARIANTS.map((variant) => (
            <View key={variant} style={styles.row}>
              <Button
                title={variant}
                onPress={() => {}}
                variant={variant}
                accessibilityLabel={`${variant} button`}
              />
            </View>
          ))}
        </Section>

        {/* Sizes */}
        <Section title="Sizes">
          {SIZES.map((size) => (
            <View key={size} style={styles.row}>
              <Button
                title={size}
                onPress={() => {}}
                variant="primary"
                size={size}
                accessibilityLabel={`${size} button`}
              />
            </View>
          ))}
        </Section>

        {/* Loading State */}
        <Section title="Loading State">
          {VARIANTS.slice(0, 3).map((variant) => (
            <View key={variant} style={styles.row}>
              <Button
                title="Loading..."
                onPress={() => simulateLoading(variant)}
                variant={variant}
                loading={loadingVariant === variant}
                accessibilityLabel={`${variant} loading button`}
              />
            </View>
          ))}
          <Text style={styles.hint}>Tap to simulate 2s load</Text>
        </Section>

        {/* Disabled State */}
        <Section title="Disabled State">
          {VARIANTS.map((variant) => (
            <View key={variant} style={styles.row}>
              <Button
                title="Disabled"
                onPress={() => {}}
                variant={variant}
                disabled
                accessibilityLabel={`${variant} disabled button`}
                accessibilityState={{ disabled: true }}
              />
            </View>
          ))}
        </Section>

        {/* With Icons */}
        <Section title="With Icons">
          <View style={styles.row}>
            <Button
              title="Save"
              onPress={() => {}}
              variant="primary"
              iconLeft={<Ionicons name="checkmark" size={18} color={colors.text.inverse} />}
            />
          </View>
          <View style={styles.row}>
            <Button
              title="Share"
              onPress={() => {}}
              variant="outline"
              iconLeft={<Ionicons name="share-outline" size={18} color="#007AFF" />}
            />
          </View>
          <View style={styles.row}>
            <Button
              title="Delete"
              onPress={() => {}}
              variant="danger"
              iconLeft={<Ionicons name="trash-outline" size={18} color="#FFFFFF" />}
            />
          </View>
        </Section>

        {/* Full Width */}
        <Section title="Full Width">
          <Button title="Full Width Primary" onPress={() => {}} variant="primary" fullWidth />
          <View style={styles.spacer} />
          <Button title="Full Width Outline" onPress={() => {}} variant="outline" fullWidth />
        </Section>
      </ScrollView>
    </AppLayout>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  row: {
    marginBottom: spacing.md,
  },
  hint: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    marginTop: -spacing.xs,
    marginBottom: spacing.sm,
  },
  spacer: {
    height: spacing.sm,
  },
});

export default ButtonShowcaseScreen;
