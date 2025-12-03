import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { sdk } from "@server/_core/sdk";
import { ENV } from "@server/_core/env";
import * as db from "@server/db";
import { STRIPE_PRICE_IDS } from "@shared/stripe-constants";

export const runtime = "nodejs";

// Lazy initialization to avoid module evaluation during build
function getStripeClient() {
  if (!ENV.stripeSecretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return new Stripe(ENV.stripeSecretKey, {
    apiVersion: "2025-11-17.clover",
  });
}

export async function POST(req: NextRequest) {
  try {
    const stripe = getStripeClient();
    // Authenticate user
    const headers = await req.headers;
    const cookieHeader = headers.get("cookie") ?? undefined;
    const authHeader = headers.get("authorization") ?? headers.get("Authorization") ?? undefined;
    
    const request = {
      headers: {
        cookie: cookieHeader,
        authorization: authHeader,
        Authorization: authHeader,
      },
    } as any;

    const user = await sdk.authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { priceId, successUrl, cancelUrl } = body;

    // Get or create Stripe customer
    let subscription = await db.getSubscriptionByUserId(user.id);
    let customerId: string;

    if (subscription?.stripeCustomerId) {
      customerId = subscription.stripeCustomerId;
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        name: user.name || undefined,
        metadata: {
          userId: user.id.toString(),
          openId: user.openId,
        },
      });
      customerId = customer.id;

      // Save customer ID to database
      await db.upsertSubscription({
        userId: user.id,
        stripeCustomerId: customerId,
        status: "incomplete",
      });
    }

    // Determine price ID - use provided, fallback to default, or Premium Monthly
    const finalPriceId = priceId || ENV.stripePriceId || STRIPE_PRICE_IDS.PREMIUM_MONTHLY;
    
    // Determine mode based on price ID (lifetime is one-time, others are subscription)
    const isLifetime = finalPriceId === STRIPE_PRICE_IDS.LIFETIME;
    const mode = isLifetime ? "payment" : "subscription";
    
    // Create checkout session config
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      mode,
      payment_method_types: ["card"],
      line_items: [
        {
          price: finalPriceId,
          quantity: 1,
        },
      ],
      success_url: successUrl || `${req.nextUrl.origin}/settings?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${req.nextUrl.origin}/settings`,
      metadata: {
        userId: user.id.toString(),
      },
    };
    
    // Add subscription_data only for subscription mode
    if (mode === "subscription") {
      sessionConfig.subscription_data = {
        metadata: {
          userId: user.id.toString(),
        },
      };
    }
    
    // Create checkout session
    const session = await stripe.checkout.sessions.create(sessionConfig);

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error("[Stripe] Create checkout session error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}

