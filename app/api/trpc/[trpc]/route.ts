import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@server/routers";
import { cookies, headers } from "next/headers";
import type { NextRequest } from "next/server";
import { sdk } from "@server/_core/sdk";

export const runtime = "nodejs";

async function createContext() {
	const hdrs = await headers();
	const cookieHeader = hdrs.get("cookie") ?? undefined;
	const authHeader = hdrs.get("authorization") ?? hdrs.get("Authorization") ?? undefined;
	
	// Create a minimal Express-like req/res for compatibility
	// Include both cookie and authorization headers for mobile app support
	const req = { 
		headers: { 
			cookie: cookieHeader,
			authorization: authHeader,
			Authorization: authHeader, // Also check capitalized version
		} 
	} as any;
	const res = {} as any;

	console.log("[Next.js Context] Headers - cookie:", cookieHeader ? "present" : "missing", "authorization:", authHeader ? "present" : "missing");

	return sdk
		.authenticateRequest(req)
		.then(user => {
			console.log("[Next.js Context] Auth result:", user ? { id: user.id, openId: user.openId } : "null");
			return { req, res, user };
		})
		.catch((error) => {
			console.log("[Next.js Context] Auth error:", error?.message || error);
			return { req, res, user: null };
		});
}

const handler = (req: NextRequest) =>
	fetchRequestHandler({
		endpoint: "/api/trpc",
		req,
		router: appRouter,
		createContext,
	});

export { handler as GET, handler as POST };


