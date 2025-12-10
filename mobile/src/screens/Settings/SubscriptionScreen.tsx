import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Linking, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import GlassCard from "../../components/GlassCard";
import GradientButton from "../../components/GradientButton";
import LoadingSkeleton from "../../components/LoadingSkeleton";
import { colors, spacing, typography, borderRadius } from "../../styles/theme";
import { trpc } from "../../api/trpc";
import { MoreStackScreenProps } from "../../navigation/types";
import AppLayout from "../../components/layout/AppLayout";
import ScreenHeader from "../../components/layout/ScreenHeader";
import { STRIPE_PRODUCTS_CONFIG, type StripeProduct } from "../../constants/subscriptions";
import { getBaseUrl } from "../../api/client";

type Props = MoreStackScreenProps<"Subscription">;

const SubscriptionScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const { data: subscription, isLoading: isLoadingSubscription } = trpc.subscription.get.useQuery();
  const { data: hasActive, isLoading: isLoadingActive } = trpc.subscription.hasActive.useQuery();
  const createCheckoutSession = trpc.subscription.createCheckoutSession.useMutation();
  const createPortalSession = trpc.subscription.createCustomerPortalSession.useMutation();

  const [selectedProduct, setSelectedProduct] = useState<StripeProduct | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePurchase = async (product: StripeProduct) => {
    if (Platform.OS === "ios") {
      // On iOS, redirect to App Store for In-App Purchase
      Alert.alert(
        "In-App Purchase",
        "For iOS, subscriptions are managed through the App Store. Please use the App Store subscription options.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Learn More",
            onPress: () => {
              // You can add a link to your App Store subscription page here
              Alert.alert("Info", "iOS subscriptions are handled through Apple's In-App Purchase system.");
            },
          },
        ]
      );
      return;
    }

    setIsProcessing(true);
    setSelectedProduct(product);

    try {
      // Get base URL from API client
      const baseUrl = getBaseUrl();
      
      const result = await createCheckoutSession.mutateAsync({
        priceId: product.priceId,
        successUrl: `${baseUrl}/settings?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${baseUrl}/settings`,
      });

      if (result.url) {
        // Open Stripe checkout in browser
        const canOpen = await Linking.canOpenURL(result.url);
        if (canOpen) {
          await Linking.openURL(result.url);
        } else {
          Alert.alert("Error", "Unable to open checkout page. Please try again.");
        }
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to create checkout session. Please try again.");
    } finally {
      setIsProcessing(false);
      setSelectedProduct(null);
    }
  };

  const handleManageSubscription = async () => {
    setIsProcessing(true);
    try {
      const result = await createPortalSession.mutateAsync();
      if (result.url) {
        const canOpen = await Linking.canOpenURL(result.url);
        if (canOpen) {
          await Linking.openURL(result.url);
        } else {
          Alert.alert("Error", "Unable to open customer portal. Please try again.");
        }
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to open customer portal. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const formatPrice = (price: number, period: string) => {
    if (period === "lifetime") {
      return `$${price.toFixed(2)}`;
    }
    if (period === "yearly") {
      return `$${price.toFixed(2)}/year`;
    }
    return `$${price.toFixed(2)}/month`;
  };

  const getStatusBadge = () => {
    if (isLoadingSubscription || isLoadingActive) {
      return null;
    }

    if (hasActive && subscription) {
      return (
        <View style={styles.statusBadge}>
          <Ionicons name="checkmark-circle" size={16} color={colors.success} />
          <Text style={styles.statusText}>
            {subscription.status === "trialing" ? "Trial" : "Active"}
          </Text>
        </View>
      );
    }

    return (
      <View style={[styles.statusBadge, styles.statusBadgeFree]}>
        <Ionicons name="person-circle-outline" size={16} color={colors.text.secondary} />
        <Text style={[styles.statusText, styles.statusTextFree]}>Free</Text>
      </View>
    );
  };

  // Group products by tier
  const premiumProducts = STRIPE_PRODUCTS_CONFIG.filter((p) => p.tier === "premium");
  const familyProducts = STRIPE_PRODUCTS_CONFIG.filter((p) => p.tier === "family");
  const lifetimeProduct = STRIPE_PRODUCTS_CONFIG.find((p) => p.tier === "lifetime");

  return (
    <AppLayout scrollable contentContainerStyle={{ paddingBottom: spacing.xxl }}>
      <ScreenHeader
        title="Subscription"
        subtitle="Unlock premium features and support Sous"
        onBackPress={() => navigation.goBack()}
      />

      {/* Current Status */}
      <GlassCard style={styles.card}>
        <View style={styles.statusHeader}>
          <Text style={styles.sectionTitle}>Current Plan</Text>
          {getStatusBadge()}
        </View>
        {isLoadingSubscription ? (
          <LoadingSkeleton height={20} width="60%" />
        ) : subscription ? (
          <>
            <Text style={styles.label}>Status</Text>
            <Text style={styles.value}>{subscription.status}</Text>
            {subscription.currentPeriodEnd && (
              <>
                <Text style={styles.label}>Renews</Text>
                <Text style={styles.value}>
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </Text>
              </>
            )}
            {hasActive && (
              <GradientButton
                title="Manage Subscription"
                variant="secondary"
                onPress={handleManageSubscription}
                disabled={isProcessing || createPortalSession.isPending}
                style={{ marginTop: spacing.md }}
              />
            )}
          </>
        ) : (
          <Text style={styles.value}>Free Plan</Text>
        )}
      </GlassCard>

      {/* Premium Plans */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Premium Plans</Text>
        {premiumProducts.map((product) => (
          <GlassCard
            key={product.priceId}
            style={[styles.productCard, product.isPopular && styles.productCardPopular]}
          >
            {product.isPopular && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularText}>Most Popular</Text>
              </View>
            )}
            <View style={styles.productHeader}>
              <View style={styles.productTitleRow}>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productPrice}>{formatPrice(product.price, product.billingPeriod)}</Text>
              </View>
              <Text style={styles.productDescription}>{product.description}</Text>
            </View>
            <View style={styles.featuresContainer}>
              {product.features.map((feature, index) => (
                <View key={index} style={styles.featureRow}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.olive} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
            <GradientButton
              title={
                isProcessing && selectedProduct?.priceId === product.priceId
                  ? "Processing..."
                  : Platform.OS === "ios"
                  ? "Available on App Store"
                  : "Subscribe"
              }
              onPress={() => handlePurchase(product)}
              disabled={isProcessing || (hasActive && subscription?.status === "active")}
              style={{ marginTop: spacing.md }}
            />
          </GlassCard>
        ))}
      </View>

      {/* Family Plans */}
      {familyProducts.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Family Plans</Text>
          {familyProducts.map((product) => (
            <GlassCard key={product.priceId} style={styles.productCard}>
              <View style={styles.productHeader}>
                <View style={styles.productTitleRow}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productPrice}>{formatPrice(product.price, product.billingPeriod)}</Text>
                </View>
                <Text style={styles.productDescription}>{product.description}</Text>
              </View>
              <View style={styles.featuresContainer}>
                {product.features.map((feature, index) => (
                  <View key={index} style={styles.featureRow}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.olive} />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
              <GradientButton
                title={
                  isProcessing && selectedProduct?.priceId === product.priceId
                    ? "Processing..."
                    : Platform.OS === "ios"
                    ? "Available on App Store"
                    : "Subscribe"
                }
                onPress={() => handlePurchase(product)}
                disabled={isProcessing || (hasActive && subscription?.status === "active")}
                style={{ marginTop: spacing.md }}
              />
            </GlassCard>
          ))}
        </View>
      )}

      {/* Lifetime Plan */}
      {lifetimeProduct && (
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>One-Time Purchase</Text>
          <GlassCard style={[styles.productCard, styles.lifetimeCard]}>
            <View style={styles.productHeader}>
              <View style={styles.productTitleRow}>
                <Text style={styles.productName}>{lifetimeProduct.name}</Text>
                <Text style={styles.productPrice}>{formatPrice(lifetimeProduct.price, lifetimeProduct.billingPeriod)}</Text>
              </View>
              <Text style={styles.productDescription}>{lifetimeProduct.description}</Text>
            </View>
            <View style={styles.featuresContainer}>
              {lifetimeProduct.features.map((feature, index) => (
                <View key={index} style={styles.featureRow}>
                  <Ionicons name="star" size={16} color={colors.russet} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
            <GradientButton
              title={
                isProcessing && selectedProduct?.priceId === lifetimeProduct.priceId
                  ? "Processing..."
                  : Platform.OS === "ios"
                  ? "Available on App Store"
                  : "Purchase"
              }
              onPress={() => handlePurchase(lifetimeProduct)}
              disabled={isProcessing}
              style={{ marginTop: spacing.md }}
            />
          </GlassCard>
        </View>
      )}

      {Platform.OS === "ios" && (
        <GlassCard style={styles.card}>
          <Text style={styles.infoText}>
            <Ionicons name="information-circle" size={16} color={colors.info} /> On iOS, subscriptions are
            managed through Apple's App Store. Please use the App Store subscription options.
          </Text>
        </GlassCard>
      )}
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.navy,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  statusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.navy,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.success + "20",
  },
  statusBadgeFree: {
    backgroundColor: colors.glass.background,
  },
  statusText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.success,
  },
  statusTextFree: {
    color: colors.text.secondary,
  },
  label: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing.sm,
  },
  value: {
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium,
  },
  productCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    position: "relative",
  },
  productCardPopular: {
    borderWidth: 2,
    borderColor: colors.olive,
  },
  lifetimeCard: {
    borderWidth: 2,
    borderColor: colors.russet,
  },
  popularBadge: {
    position: "absolute",
    top: -spacing.xs,
    right: spacing.md,
    backgroundColor: colors.olive,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    zIndex: 1,
  },
  popularText: {
    color: colors.text.inverse,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  productHeader: {
    marginBottom: spacing.md,
  },
  productTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  productName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.navy,
    flex: 1,
  },
  productPrice: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.olive,
  },
  productDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  featuresContainer: {
    gap: spacing.xs,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.xs,
  },
  featureText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    flex: 1,
  },
  infoText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: typography.lineHeight.relaxed * typography.fontSize.sm,
  },
});

export default SubscriptionScreen;

