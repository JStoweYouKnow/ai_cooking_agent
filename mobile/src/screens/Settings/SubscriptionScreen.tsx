import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Linking, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../../contexts/AuthContext";
import { useRevenueCat } from "../../contexts/RevenueCatContext";
import GlassCard from "../../components/GlassCard";
import GradientButton from "../../components/GradientButton";
import LoadingSkeleton from "../../components/LoadingSkeleton";
import { colors, spacing, typography, borderRadius } from "../../styles/theme";
import { trpc } from "../../api/trpc";
import { MoreStackScreenProps } from "../../navigation/types";
import AppLayout from "../../components/layout/AppLayout";
import ScreenHeader from "../../components/layout/ScreenHeader";
import { STRIPE_PRODUCTS_CONFIG, STRIPE_PRICE_IDS, type StripeProduct } from "../../constants/subscriptions";
import { getBaseUrl } from "../../api/client";
import { REVENUECAT_PRODUCT_IDS, INTRO_ELIGIBILITY_STATUS } from "../../services/revenueCat";
import { CREATOR_CONFIG, getCreatorEndorsement } from "../../constants/creator";

const INTRO_OFFER_VIEWED_KEY = "intro_offer_screen_viewed_at";
const INTRO_OFFER_DAYS = 3;

// Map Stripe price IDs to RevenueCat product IDs for iOS
const STRIPE_TO_REVENUECAT_MAP: Record<string, string> = {
  [STRIPE_PRICE_IDS.PREMIUM_MONTHLY]: REVENUECAT_PRODUCT_IDS.PREMIUM_MONTHLY,
  [STRIPE_PRICE_IDS.PREMIUM_YEARLY]: REVENUECAT_PRODUCT_IDS.PREMIUM_YEARLY,
  [STRIPE_PRICE_IDS.FAMILY_MONTHLY]: REVENUECAT_PRODUCT_IDS.FAMILY_MONTHLY,
  [STRIPE_PRICE_IDS.FAMILY_YEARLY]: REVENUECAT_PRODUCT_IDS.FAMILY_YEARLY,
  [STRIPE_PRICE_IDS.LIFETIME]: REVENUECAT_PRODUCT_IDS.LIFETIME,
};

type Props = MoreStackScreenProps<"Subscription">;

const SubscriptionScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const { data: subscription, isLoading: isLoadingSubscription } = trpc.subscription.get.useQuery();
  const { data: hasActive, isLoading: isLoadingActive } = trpc.subscription.hasActive.useQuery();
  const createCheckoutSession = trpc.subscription.createCheckoutSession.useMutation();
  const createPortalSession = trpc.subscription.createCustomerPortalSession.useMutation();

  // RevenueCat for iOS purchases
  const {
    isInitialized: isRevenueCatReady,
    isLoading: isRevenueCatLoading,
    hasActiveSubscription: hasIOSSubscription,
    introEligibility,
    purchaseByProductId,
    restorePurchases: restoreIOSPurchases,
    refreshCustomerInfo,
  } = useRevenueCat();

  const [selectedProduct, setSelectedProduct] = useState<StripeProduct | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [introCountdownDays, setIntroCountdownDays] = useState<number | null>(null);

  // Persist first view and compute countdown for intro offer (e.g. 3 days)
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(INTRO_OFFER_VIEWED_KEY);
        const now = Date.now();
        if (raw == null) {
          await AsyncStorage.setItem(INTRO_OFFER_VIEWED_KEY, String(now));
          setIntroCountdownDays(INTRO_OFFER_DAYS);
          return;
        }
        const firstViewed = parseInt(raw, 10);
        const daysSince = Math.floor((now - firstViewed) / 86400000);
        const left = Math.max(0, INTRO_OFFER_DAYS - daysSince);
        setIntroCountdownDays(left);
      } catch {
        setIntroCountdownDays(null);
      }
    })();
  }, []);

  const isIntroEligibleForProduct = (priceId: string) => {
    const rcId = STRIPE_TO_REVENUECAT_MAP[priceId];
    return rcId && introEligibility[rcId]?.status === INTRO_ELIGIBILITY_STATUS.ELIGIBLE;
  };
  const hasAnyIntroEligible = STRIPE_PRODUCTS_CONFIG.some((p) => isIntroEligibleForProduct(p.priceId));

  const handlePurchase = async (product: StripeProduct) => {
    // iOS: Use RevenueCat for App Store purchases
    if (Platform.OS === "ios") {
      if (!isRevenueCatReady) {
        Alert.alert(
          "Not Ready",
          "The subscription service is still loading. Please wait a moment and try again."
        );
        return;
      }

      const revenueCatProductId = STRIPE_TO_REVENUECAT_MAP[product.priceId];
      if (!revenueCatProductId) {
        Alert.alert("Error", "This product is not available for iOS.");
        return;
      }

      setIsProcessing(true);
      setSelectedProduct(product);

      try {
        const success = await purchaseByProductId(revenueCatProductId);
        if (success) {
          Alert.alert("Success", "Your subscription is now active! Thank you for your purchase.");
          // Refresh backend subscription status
          utils.subscription.get.invalidate();
          utils.subscription.hasActive.invalidate();
        }
        // If success is false, user cancelled - no need to show alert
      } catch (error: any) {
        Alert.alert("Purchase Failed", error.message || "Unable to complete purchase. Please try again.");
      } finally {
        setIsProcessing(false);
        setSelectedProduct(null);
      }
      return;
    }

    // Android/Web: Use Stripe
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

  const handleRestorePurchases = async () => {
    // iOS: Use RevenueCat to restore purchases
    if (Platform.OS === "ios") {
      if (!isRevenueCatReady) {
        Alert.alert(
          "Not Ready",
          "The subscription service is still loading. Please wait a moment and try again."
        );
        return;
      }

      setIsProcessing(true);
      try {
        const success = await restoreIOSPurchases();
        if (success) {
          Alert.alert("Success", "Your purchases have been restored!");
          // Refresh backend subscription status
          utils.subscription.get.invalidate();
          utils.subscription.hasActive.invalidate();
        } else {
          Alert.alert(
            "No Purchases Found",
            "No previous purchases were found to restore. If you believe this is an error, please contact support."
          );
        }
      } catch (error: any) {
        Alert.alert("Error", error.message || "Failed to restore purchases. Please try again.");
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    // Android/Web: Check with our backend
    setIsProcessing(true);
    try {
      // Invalidate subscription cache to fetch latest from Stripe
      await utils.subscription.get.invalidate();
      await utils.subscription.hasActive.invalidate();
      Alert.alert("Success", "Your subscription status has been refreshed.");
    } catch (error: any) {
      Alert.alert("Error", "Failed to restore purchases. Please try again.");
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

    // Check both server subscription and iOS RevenueCat subscription
    const isSubscriptionActive = hasActive || (Platform.OS === "ios" && hasIOSSubscription);

    if (isSubscriptionActive) {
      return (
        <View style={styles.statusBadge}>
          <Ionicons name="checkmark-circle" size={16} color={colors.success} />
          <Text style={styles.statusText}>
            {subscription?.status === "trialing" ? "Trial" : "Active"}
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

      {/* Creator Endorsement Hero Section */}
      <View style={styles.heroSection}>
        <LinearGradient
          colors={[CREATOR_CONFIG.brandColors.primary, CREATOR_CONFIG.brandColors.secondary]}
          style={styles.heroGradient}
        >
          <View style={styles.heroContent}>
            <Ionicons name="restaurant" size={48} color={colors.text.inverse} />
            <Text style={styles.heroTitle}>Trusted by {CREATOR_CONFIG.name}</Text>
            <Text style={styles.heroEndorsement}>"{getCreatorEndorsement()}"</Text>
            <Text style={styles.heroAuthor}>- {CREATOR_CONFIG.name}</Text>
          </View>
        </LinearGradient>
      </View>

      {/* Value Proposition */}
      <GlassCard style={styles.valueCard}>
        <Text style={styles.valueTitle}>Why Upgrade?</Text>
        <View style={styles.valueList}>
          <View style={styles.valueItem}>
            <Ionicons name="checkmark-circle" size={20} color={colors.olive} />
            <Text style={styles.valueText}>Unlimited recipe saves</Text>
          </View>
          <View style={styles.valueItem}>
            <Ionicons name="checkmark-circle" size={20} color={colors.olive} />
            <Text style={styles.valueText}>Import from any recipe website</Text>
          </View>
          <View style={styles.valueItem}>
            <Ionicons name="checkmark-circle" size={20} color={colors.olive} />
            <Text style={styles.valueText}>AI-powered meal planning</Text>
          </View>
          <View style={styles.valueItem}>
            <Ionicons name="checkmark-circle" size={20} color={colors.olive} />
            <Text style={styles.valueText}>Advanced shopping lists</Text>
          </View>
          <View style={styles.valueItem}>
            <Ionicons name="checkmark-circle" size={20} color={colors.olive} />
            <Text style={styles.valueText}>Ad-free experience</Text>
          </View>
        </View>
      </GlassCard>

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

      {/* Intro offer countdown */}
      {Platform.OS === "ios" && hasAnyIntroEligible && introCountdownDays != null && introCountdownDays > 0 && (
        <GlassCard style={styles.introCountdownCard}>
          <Ionicons name="time" size={20} color={colors.olive} />
          <Text style={styles.introCountdownText}>
            Intro offer ends in {introCountdownDays} day{introCountdownDays !== 1 ? "s" : ""}
          </Text>
        </GlassCard>
      )}

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
            {Platform.OS === "ios" && isIntroEligibleForProduct(product.priceId) && (
              <View style={styles.introBadge}>
                <Text style={styles.introBadgeText}>Intro offer</Text>
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
                (isProcessing || isRevenueCatLoading) && selectedProduct?.priceId === product.priceId
                  ? "Processing..."
                  : "Subscribe"
              }
              onPress={() => handlePurchase(product)}
              disabled={isProcessing || isRevenueCatLoading || (hasActive && subscription?.status === "active") || (Platform.OS === "ios" && hasIOSSubscription)}
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
              {Platform.OS === "ios" && isIntroEligibleForProduct(product.priceId) && (
                <View style={styles.introBadge}>
                  <Text style={styles.introBadgeText}>Intro offer</Text>
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
                  (isProcessing || isRevenueCatLoading) && selectedProduct?.priceId === product.priceId
                    ? "Processing..."
                    : "Subscribe"
                }
                onPress={() => handlePurchase(product)}
                disabled={isProcessing || isRevenueCatLoading || (hasActive && subscription?.status === "active") || (Platform.OS === "ios" && hasIOSSubscription)}
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
                (isProcessing || isRevenueCatLoading) && selectedProduct?.priceId === lifetimeProduct.priceId
                  ? "Processing..."
                  : "Purchase"
              }
              onPress={() => handlePurchase(lifetimeProduct)}
              disabled={isProcessing || isRevenueCatLoading || (Platform.OS === "ios" && hasIOSSubscription)}
              style={{ marginTop: spacing.md }}
            />
          </GlassCard>
        </View>
      )}

      {Platform.OS === "ios" && !isRevenueCatReady && (
        <GlassCard style={styles.card}>
          <Text style={styles.infoText}>
            <Ionicons name="information-circle" size={16} color={colors.info} /> Loading subscription options...
          </Text>
        </GlassCard>
      )}

      {/* Restore Purchases - Required by App Store */}
      <GlassCard style={styles.card}>
        <Text style={styles.sectionTitle}>Already Purchased?</Text>
        <Text style={styles.restoreDescription}>
          If you've previously purchased a subscription on another device or after reinstalling the app,
          you can restore your purchases here.
        </Text>
        <GradientButton
          title={isProcessing ? "Restoring..." : "Restore Purchases"}
          variant="secondary"
          onPress={handleRestorePurchases}
          disabled={isProcessing}
          style={{ marginTop: spacing.sm }}
          accessibilityLabel="Restore previous purchases"
          accessibilityHint="Restores any subscriptions purchased on another device"
        />
      </GlassCard>

      {/* Refresh entitlements */}
      <GlassCard style={styles.card}>
        <Text style={styles.sectionTitle}>Trouble accessing Premium?</Text>
        <Text style={styles.restoreDescription}>
          Refresh your access to re-fetch your subscription status from RevenueCat.
        </Text>
        <GradientButton
          title="Refresh Access"
          variant="secondary"
          onPress={async () => {
            try {
              await refreshCustomerInfo();
              Alert.alert("Refreshed", "Subscription status has been refreshed.");
            } catch (err: any) {
              Alert.alert("Error", err?.message || "Could not refresh access.");
            }
          }}
          style={{ marginTop: spacing.sm }}
          accessibilityLabel="Refresh access"
          accessibilityHint="Re-fetches your subscription status"
        />
      </GlassCard>
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
  introCountdownCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  introCountdownText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  introBadge: {
    position: "absolute",
    top: -spacing.xs,
    left: spacing.md,
    backgroundColor: colors.russet,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    zIndex: 1,
  },
  introBadgeText: {
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
  restoreDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  heroSection: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
    borderRadius: borderRadius.lg,
    overflow: "hidden",
  },
  heroGradient: {
    padding: spacing.xl,
  },
  heroContent: {
    alignItems: "center",
  },
  heroTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.inverse,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  heroEndorsement: {
    fontSize: typography.fontSize.md,
    color: colors.text.inverse,
    fontStyle: "italic",
    textAlign: "center",
    lineHeight: typography.lineHeight.relaxed * typography.fontSize.md,
    marginBottom: spacing.sm,
  },
  heroAuthor: {
    fontSize: typography.fontSize.sm,
    color: colors.text.inverse,
    fontWeight: typography.fontWeight.semibold,
  },
  valueCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  valueTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.navy,
    marginBottom: spacing.md,
  },
  valueList: {
    gap: spacing.sm,
  },
  valueItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  valueText: {
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
  },
});

export default SubscriptionScreen;

