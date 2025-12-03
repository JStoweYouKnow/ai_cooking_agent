import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema-postgres";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  // Log headers for debugging
  const authHeader = opts.req.headers.authorization || (opts.req.headers as Record<string, unknown>)["Authorization"];
  console.log("[Context] ===== CONTEXT CREATION START =====");
  console.log("[Context] Request headers - authorization:", authHeader ? "present" : "missing");
  console.log("[Context] Authorization header value:", authHeader ? (typeof authHeader === 'string' ? authHeader.substring(0, 50) + '...' : String(authHeader)) : "null/undefined");
  console.log("[Context] All header keys:", Object.keys(opts.req.headers));
  console.log("[Context] Request method:", opts.req.method);
  console.log("[Context] Request path:", opts.req.url);

  try {
    user = await sdk.authenticateRequest(opts.req);
    console.log("[Context] Authentication result:", user ? { id: user.id, openId: user.openId, name: user.name } : "null");
    if (!user) {
      console.warn("[Context] Authentication returned null user - this may indicate an auth failure");
    }
  } catch (error: any) {
    // Authentication is optional for public procedures.
    // Log the error for debugging, but don't throw
    const errorMessage = error?.message || String(error);
    const errorCode = error?.code || error?.statusCode || "UNKNOWN";
    console.error("[Context] Auth error (non-blocking):", errorMessage);
    console.error("[Context] Auth error code:", errorCode);
    console.error("[Context] Auth error stack:", error?.stack);
    console.error("[Context] Auth error details:", {
      code: error?.code,
      statusCode: error?.statusCode,
      data: error?.data,
      name: error?.name,
    });
    
    // Store error info in context for auth.me to access
    // This allows us to return a more helpful error message
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
