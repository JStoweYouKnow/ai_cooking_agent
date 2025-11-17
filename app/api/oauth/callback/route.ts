import { NextResponse, type NextRequest } from "next/server";
import { sdk } from "@server/_core/sdk";
import * as db from "@server/db";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getNextSessionCookieOptions } from "@server/_core/nextCookies";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
	const { searchParams } = new URL(req.url);
	const code = searchParams.get("code") ?? undefined;
	const state = searchParams.get("state") ?? undefined;

	if (!code || !state) {
		return NextResponse.json({ error: "code and state are required" }, { status: 400 });
	}

	try {
		const tokenResponse = await sdk.exchangeCodeForToken(code, state);
		const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

		if (!userInfo.openId) {
			return NextResponse.json({ error: "openId missing from user info" }, { status: 400 });
		}

		await db.upsertUser({
			openId: userInfo.openId,
			name: userInfo.name || null,
			email: userInfo.email ?? null,
			loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
			lastSignedIn: new Date(),
		});

		const sessionToken = await sdk.createSessionToken(userInfo.openId, {
			name: userInfo.name || "",
			expiresInMs: ONE_YEAR_MS,
		});

		const res = NextResponse.redirect(new URL("/", req.url));
		const cookieOptions = getNextSessionCookieOptions(req);
		res.cookies.set(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS / 1000 });
		return res;
	} catch (error) {
		console.error("[OAuth] Callback failed", error);
		return NextResponse.json({ error: "OAuth callback failed" }, { status: 500 });
	}
}


