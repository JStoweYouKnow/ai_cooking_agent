import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { ENV } from "@server/_core/env";
import * as db from "@server/db";

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
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");
  const stripe = getStripeClient();

  if (!signature || !ENV.stripeWebhookSecret) {
    return NextResponse.json(
      { error: "Missing signature or webhook secret" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      ENV.stripeWebhookSecret
    );
  } catch (err: any) {
    console.error("[Stripe] Webhook signature verification failed:", err.message);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );
          await handleSubscriptionUpdate(subscription);
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await db.updateSubscriptionStatus(
          subscription.id,
          "canceled",
          {
            canceledAt: new Date(),
            cancelAtPeriodEnd: false,
          }
        );
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        // In newer Stripe API, use type assertion to access properties
        const invoiceAny = invoice as any;
        const subscriptionId = invoiceAny.subscription as string | null | undefined;
        const paymentIntentId = invoiceAny.payment_intent as string | null | undefined;
        if (subscriptionId && paymentIntentId) {
          const subscription = await db.getSubscriptionByStripeSubscriptionId(
            subscriptionId
          );
          if (subscription) {
            await db.createPayment({
              userId: subscription.userId,
              stripePaymentIntentId: paymentIntentId,
              stripeChargeId: invoiceAny.charge as string || undefined,
              amount: invoice.amount_paid,
              currency: invoice.currency,
              status: "succeeded",
              description: invoice.description || `Subscription payment for ${subscriptionId}`,
              metadata: invoice.metadata as any,
            });
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const invoiceAny = invoice as any;
        const subscriptionId = invoiceAny.subscription as string | null | undefined;
        const paymentIntentId = invoiceAny.payment_intent as string | null | undefined;
        if (subscriptionId && paymentIntentId) {
          const subscription = await db.getSubscriptionByStripeSubscriptionId(
            subscriptionId
          );
          if (subscription) {
            await db.createPayment({
              userId: subscription.userId,
              stripePaymentIntentId: paymentIntentId,
              amount: invoice.amount_due,
              currency: invoice.currency,
              status: "failed",
              description: invoice.description || `Failed payment for ${subscriptionId}`,
              metadata: invoice.metadata as any,
            });
          }
        }
        break;
      }

      default:
        console.log(`[Stripe] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("[Stripe] Webhook handler error:", error);
    return NextResponse.json(
      { error: error.message || "Webhook handler failed" },
      { status: 500 }
    );
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const existingSubscription = await db.getSubscriptionByStripeCustomerId(customerId);

  const statusMap: Record<string, "active" | "canceled" | "incomplete" | "incomplete_expired" | "past_due" | "trialing" | "unpaid" | "paused"> = {
    active: "active",
    canceled: "canceled",
    incomplete: "incomplete",
    incomplete_expired: "incomplete_expired",
    past_due: "past_due",
    trialing: "trialing",
    unpaid: "unpaid",
    paused: "paused",
  };

  const status = statusMap[subscription.status] || "incomplete";

  // Handle timestamp conversion - use type assertion for all properties due to API version changes
  const subscriptionAny = subscription as any;
  
  const subscriptionData = {
    stripeSubscriptionId: subscription.id,
    stripePriceId: subscriptionAny.items?.data?.[0]?.price?.id || undefined,
    status,
    currentPeriodStart: subscriptionAny.current_period_start ? new Date((subscriptionAny.current_period_start as number) * 1000) : new Date(),
    currentPeriodEnd: subscriptionAny.current_period_end ? new Date((subscriptionAny.current_period_end as number) * 1000) : new Date(),
    cancelAtPeriodEnd: subscriptionAny.cancel_at_period_end || false,
    canceledAt: subscriptionAny.canceled_at ? new Date((subscriptionAny.canceled_at as number) * 1000) : undefined,
    trialStart: subscriptionAny.trial_start ? new Date((subscriptionAny.trial_start as number) * 1000) : undefined,
    trialEnd: subscriptionAny.trial_end ? new Date((subscriptionAny.trial_end as number) * 1000) : undefined,
  };

  if (existingSubscription) {
    await db.upsertSubscription({
      ...existingSubscription,
      ...subscriptionData,
    });
  } else {
    // If subscription doesn't exist, we need to find the user by customer ID
    // This shouldn't happen in normal flow, but handle it gracefully
    console.warn(`[Stripe] Subscription update for unknown customer: ${customerId}`);
  }
}


