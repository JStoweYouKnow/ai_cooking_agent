import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@server/routers";
import { cookies, headers } from "next/headers";
import type { NextRequest } from "next/server";
import { sdk } from "@server/_core/sdk";

export const runtime = "nodejs";

function createContext() {
	const hdrs = headers();
	const cookieHeader = hdrs.get("cookie") ?? undefined;
	// Create a minimal Express-like req/res for compatibility
	const req = { headers: { cookie: cookieHeader } } as any;
	const res = {} as any;

	return sdk
		.authenticateRequest(req)
		.then(user => ({ req, res, user }))
		.catch(() => ({ req, res, user: null }));
}

const handler = (req: NextRequest) =>
	fetchRequestHandler({
		endpoint: "/api/trpc",
		req,
		router: appRouter,
		createContext,
	});

export { handler as GET, handler as POST };


