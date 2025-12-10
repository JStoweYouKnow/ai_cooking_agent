/**
 * Subscription Product and Price IDs
 * These match the products created in Stripe Dashboard
 */

const REQUIRED_PRICE_ENV_VARS = {
  PREMIUM_MONTHLY: "EXPO_PUBLIC_STRIPE_PRICE_PREMIUM_MONTHLY",
  PREMIUM_YEARLY: "EXPO_PUBLIC_STRIPE_PRICE_PREMIUM_YEARLY",
  FAMILY_MONTHLY: "EXPO_PUBLIC_STRIPE_PRICE_FAMILY_MONTHLY",
  FAMILY_YEARLY: "EXPO_PUBLIC_STRIPE_PRICE_FAMILY_YEARLY",
  LIFETIME: "EXPO_PUBLIC_STRIPE_PRICE_LIFETIME",
} as const;

const missingPriceEnvVars = Object.values(REQUIRED_PRICE_ENV_VARS).filter(
  (envVar) => !process.env[envVar],
);

if (missingPriceEnvVars.length > 0) {
  const message = `Missing Stripe price env vars: ${missingPriceEnvVars.join(", ")}`;
  console.error(message);
  throw new Error(message);
}

// Stripe Price IDs
export const STRIPE_PRICE_IDS = {
  PREMIUM_MONTHLY: process.env.EXPO_PUBLIC_STRIPE_PRICE_PREMIUM_MONTHLY as string, // $4.99/month
  PREMIUM_YEARLY: process.env.EXPO_PUBLIC_STRIPE_PRICE_PREMIUM_YEARLY as string, // $49.99/year
  FAMILY_MONTHLY: process.env.EXPO_PUBLIC_STRIPE_PRICE_FAMILY_MONTHLY as string, // $9.99/month
  FAMILY_YEARLY: process.env.EXPO_PUBLIC_STRIPE_PRICE_FAMILY_YEARLY as string, // $99.99/year
  LIFETIME: process.env.EXPO_PUBLIC_STRIPE_PRICE_LIFETIME as string, // $149.99 one-time
} as const;

// Subscription tier mapping
export type SubscriptionTier = "free" | "premium" | "family" | "lifetime";

export interface StripeProduct {
  priceId: string;
  productId: string;
  tier: SubscriptionTier;
  name: string;
  price: number;
  billingPeriod: "monthly" | "yearly" | "lifetime";
  description: string;
  features: string[];
  isPopular?: boolean;
}

export const STRIPE_PRODUCTS_CONFIG: StripeProduct[] = [
  {
    priceId: STRIPE_PRICE_IDS.PREMIUM_MONTHLY,
    productId: "prod_TVvN6Fy81bQ0vN",
    tier: "premium",
    name: "Premium Chef",
    price: 4.99,
    billingPeriod: "monthly",
    description: "Unlimited recipes, AI assistant, and meal planning",
    features: [
      "Unlimited recipes & collections",
      "Unlimited AI assistance",
      "7-day meal planning",
      "Nutrition analysis",
      "Recipe scaling & sharing",
      "PDF export",
      "Priority support",
    ],
    isPopular: true,
  },
  {
    priceId: STRIPE_PRICE_IDS.PREMIUM_YEARLY,
    productId: "prod_TVvN6Fy81bQ0vN",
    tier: "premium",
    name: "Premium Chef Annual",
    price: 49.99,
    billingPeriod: "yearly",
    description: "Save 17% with annual billing",
    features: [
      "Everything in Monthly",
      "Save $10/year",
      "Lock in your rate",
    ],
  },
  {
    priceId: STRIPE_PRICE_IDS.FAMILY_MONTHLY,
    productId: "prod_TVvN3pwOfurDTp",
    tier: "family",
    name: "Family Kitchen Master",
    price: 9.99,
    billingPeriod: "monthly",
    description: "Premium for up to 5 family members",
    features: [
      "Everything in Premium",
      "Up to 5 family members",
      "Shared recipe collections",
      "Collaborative shopping lists",
      "Multiple pantries",
      "Family meal planning",
    ],
  },
  {
    priceId: STRIPE_PRICE_IDS.FAMILY_YEARLY,
    productId: "prod_TVvN3pwOfurDTp",
    tier: "family",
    name: "Family Annual",
    price: 99.99,
    billingPeriod: "yearly",
    description: "Save 17% with annual billing",
    features: [
      "Everything in Family Monthly",
      "Save $20/year",
    ],
  },
  {
    priceId: STRIPE_PRICE_IDS.LIFETIME,
    productId: "prod_TVvNW8NVfEss3v",
    tier: "lifetime",
    name: "Culinary Legend",
    price: 149.99,
    billingPeriod: "lifetime",
    description: "Pay once, cook forever",
    features: [
      "All Premium features",
      "Lifetime access",
      "All future updates",
      "VIP support",
      "Early access to new features",
      "No recurring charges",
    ],
  },
];

// Helper function to get product by price ID
export function getProductByPriceId(priceId: string): StripeProduct | undefined {
  return STRIPE_PRODUCTS_CONFIG.find((p) => p.priceId === priceId);
}

// Helper function to get products by tier
export function getProductsByTier(tier: SubscriptionTier): StripeProduct[] {
  return STRIPE_PRODUCTS_CONFIG.filter((p) => p.tier === tier);
}



