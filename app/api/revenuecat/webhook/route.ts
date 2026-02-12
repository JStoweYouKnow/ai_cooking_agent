import { NextRequest, NextResponse } from "next/server";
import { ENV } from "@server/_core/env";
import * as db from "@server/db";

export const runtime = "nodejs";

/**
 * RevenueCat Webhook Event Types
 * https://www.revenuecat.com/docs/webhooks
 */
type RevenueCatEventType =
  | "INITIAL_PURCHASE"
  | "RENEWAL"
  | "CANCELLATION"
  | "UNCANCELLATION"
  | "NON_RENEWING_PURCHASE"
  | "SUBSCRIPTION_PAUSED"
  | "EXPIRATION"
  | "BILLING_ISSUE"
  | "PRODUCT_CHANGE"
  | "TRANSFER";

interface RevenueCatWebhookEvent {
  api_version: string;
  event: {
    type: RevenueCatEventType;
    id: string;
    app_user_id: string;
    original_app_user_id: string;
    aliases: string[];
    product_id: string;
    original_transaction_id: string;
    purchased_at_ms: number;
    expiration_at_ms?: number;
    environment: "SANDBOX" | "PRODUCTION";
    store: "APP_STORE" | "PLAY_STORE" | "STRIPE" | "PROMOTIONAL";
    is_family_share?: boolean;
    takehome_percentage?: number;
    price_in_purchased_currency?: number;
    currency?: string;
    subscriber_attributes?: Record<string, { value: string; updated_at_ms: number }>;
  };
}

// Map RevenueCat product IDs to prices in cents
const PRODUCT_PRICES: Record<string, number> = {
  "com.aicookingagent.app.premium.monthly": 499,
  "com.aicookingagent.app.premium.yearly": 4999,
  "com.aicookingagent.app.family.monthly": 999,
  "com.aicookingagent.app.family.yearly": 9999,
  "com.aicookingagent.app.lifetime": 14999,
};

// Map RevenueCat event types to subscription status
const EVENT_STATUS_MAP: Record<RevenueCatEventType, string> = {
  INITIAL_PURCHASE: "active",
  RENEWAL: "active",
  CANCELLATION: "canceled",
  UNCANCELLATION: "active",
  NON_RENEWING_PURCHASE: "active", // Lifetime purchase
  SUBSCRIPTION_PAUSED: "paused",
  EXPIRATION: "canceled",
  BILLING_ISSUE: "past_due",
  PRODUCT_CHANGE: "active",
  TRANSFER: "active",
};

export async function POST(req: NextRequest) {
  const body = await req.text();

  // Verify webhook authentication
  // RevenueCat uses Bearer token authentication
  const authHeader = req.headers.get("Authorization");
  const expectedAuth = `Bearer ${ENV.revenuecatWebhookSecret}`;

  if (!ENV.revenuecatWebhookSecret) {
    console.error("[RevenueCat] Webhook secret not configured");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  if (!authHeader || authHeader !== expectedAuth) {
    console.error("[RevenueCat] Invalid webhook authorization");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let event: RevenueCatWebhookEvent;

  try {
    event = JSON.parse(body);
  } catch (err) {
    console.error("[RevenueCat] Invalid JSON:", err);
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  console.log(
    `[RevenueCat] Received event: ${event.event.type} for user: ${event.event.app_user_id}`
  );

  try {
    // app_user_id is the server user ID (we set this during SDK initialization)
    const userId = parseInt(event.event.app_user_id, 10);

    if (isNaN(userId)) {
      console.error("[RevenueCat] Invalid user ID:", event.event.app_user_id);
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const eventData = event.event;
    const status = EVENT_STATUS_MAP[eventData.type] || "active";

    // Handle the subscription update
    await handleRevenueCatSubscriptionUpdate(userId, eventData, status);

    // Create payment record for purchases/renewals
    if (
      eventData.type === "INITIAL_PURCHASE" ||
      eventData.type === "RENEWAL" ||
      eventData.type === "NON_RENEWING_PURCHASE"
    ) {
      await createPaymentRecord(userId, eventData);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("[RevenueCat] Webhook handler error:", error);
    return NextResponse.json(
      { error: error.message || "Webhook handler failed" },
      { status: 500 }
    );
  }
}

async function handleRevenueCatSubscriptionUpdate(
  userId: number,
  eventData: RevenueCatWebhookEvent["event"],
  status: string
) {
  // Check if subscription already exists for this user
  const existing = await db.getSubscriptionByUserId(userId);

  const purchaseDate = new Date(eventData.purchased_at_ms);
  const expirationDate = eventData.expiration_at_ms
    ? new Date(eventData.expiration_at_ms)
    : null;

  const subscriptionData = {
    userId,
    // Use RevenueCat app user ID as a unique identifier for this subscription
    // If there's an existing Stripe subscription, keep that stripeCustomerId
    stripeCustomerId: existing?.stripeCustomerId || `rc_${eventData.original_app_user_id}`,
    status: status as any,
    // RevenueCat specific fields
    revenuecatAppUserId: eventData.app_user_id,
    revenuecatOriginalAppUserId: eventData.original_app_user_id,
    revenuecatProductId: eventData.product_id,
    revenuecatOriginalTransactionId: eventData.original_transaction_id,
    revenuecatPurchaseDate: purchaseDate,
    revenuecatExpirationDate: expirationDate,
    revenuecatEnvironment: eventData.environment.toLowerCase(),
    subscriptionPlatform: "revenuecat_ios",
    // Common fields
    currentPeriodStart: purchaseDate,
    currentPeriodEnd: expirationDate,
    // Handle cancellation
    ...(eventData.type === "CANCELLATION"
      ? { canceledAt: new Date(), cancelAtPeriodEnd: true }
      : {}),
    // Handle uncancellation
    ...(eventData.type === "UNCANCELLATION"
      ? { canceledAt: null, cancelAtPeriodEnd: false }
      : {}),
    updatedAt: new Date(),
  };

  if (existing) {
    // Update existing subscription
    // Only update RevenueCat fields if this is a RevenueCat event
    // Don't overwrite Stripe fields for users with Stripe subscriptions
    console.log(`[RevenueCat] Updating subscription for user ${userId}`);
    await db.upsertSubscription({
      ...existing,
      ...subscriptionData,
      // Keep Stripe fields if they exist
      stripeCustomerId: existing.stripeCustomerId || subscriptionData.stripeCustomerId,
      stripeSubscriptionId: existing.stripeSubscriptionId,
      stripePriceId: existing.stripePriceId,
    });
  } else {
    // Create new subscription
    console.log(`[RevenueCat] Creating new subscription for user ${userId}`);
    await db.upsertSubscription(subscriptionData);
  }
}

async function createPaymentRecord(
  userId: number,
  eventData: RevenueCatWebhookEvent["event"]
) {
  const amount =
    eventData.price_in_purchased_currency !== undefined
      ? Math.round(eventData.price_in_purchased_currency * 100) // Convert to cents
      : PRODUCT_PRICES[eventData.product_id] || 0;

  const currency = eventData.currency?.toLowerCase() || "usd";

  await db.createPayment({
    userId,
    stripePaymentIntentId: `rc_${eventData.original_transaction_id}`,
    amount,
    currency,
    status: "succeeded",
    description: `RevenueCat ${eventData.type} - ${eventData.product_id}`,
    metadata: {
      store: eventData.store,
      environment: eventData.environment,
      product_id: eventData.product_id,
      original_transaction_id: eventData.original_transaction_id,
      event_type: eventData.type,
    },
  });

  console.log(
    `[RevenueCat] Created payment record for user ${userId}: ${amount} ${currency}`
  );
}
