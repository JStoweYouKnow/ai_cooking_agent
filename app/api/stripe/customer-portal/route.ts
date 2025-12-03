import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { sdk } from "@server/_core/sdk";
import { ENV } from "@server/_core/env";
import * as db from "@server/db";

export const runtime = "nodejs";

const stripe = new Stripe(ENV.stripeSecretKey, {
  apiVersion: "2025-11-17.clover",
});

export async function POST(req: NextRequest) {
  try {
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

    // Get user's subscription
    const subscription = await db.getSubscriptionByUserId(user.id);
    if (!subscription || !subscription.stripeCustomerId) {
      return NextResponse.json(
        { error: "No subscription found" },
        { status: 404 }
      );
    }

    // Create customer portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${req.nextUrl.origin}/settings`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("[Stripe] Customer portal error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create customer portal session" },
      { status: 500 }
    );
  }
}


