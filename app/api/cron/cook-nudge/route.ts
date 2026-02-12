import { NextRequest, NextResponse } from "next/server";
import { ENV } from "@server/_core/env";
import * as db from "@server/db";
import { sendExpoPush } from "@server/services/push";

export const runtime = "nodejs";

/** Secures cron: if CRON_SECRET is set, require Authorization: Bearer <CRON_SECRET>. */
function authorizeCron(req: NextRequest): boolean {
  if (!ENV.cronSecret) return true;
  const auth = req.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : "";
  return token === ENV.cronSecret;
}

/**
 * Cron job: send "haven't cooked yet?" push for recipes created 3+ days ago
 * that have not been cooked and haven't had the nudge sent.
 * Call daily (e.g. Vercel Cron: 0 12 * * *).
 */
export async function GET(req: NextRequest) {
  if (!authorizeCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const candidates = await db.getRecipesForCookNudge();
    let sent = 0;

    for (const recipe of candidates) {
      const tokens = await db.getPushTokensForUser(recipe.userId);
      const title = "Haven't cooked yet?";
      const body = `Make "${recipe.name}" today — you saved it a few days ago.`;

      for (const t of tokens) {
        await sendExpoPush(t.token, {
          title,
          body,
          data: { recipeId: String(recipe.id), screen: "RecipeDetail" },
        });
        sent += 1;
      }

      await db.markCookNudgeSent(recipe.id);
    }

    return NextResponse.json({
      ok: true,
      candidates: candidates.length,
      notificationsSent: sent,
    });
  } catch (error) {
    console.error("[cron/cook-nudge]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
