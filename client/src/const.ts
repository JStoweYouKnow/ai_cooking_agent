export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

const readEnv = (key: string, fallback?: string) => {
	// Prefer Next public env
	if (typeof process !== "undefined") {
		const v = (process.env as Record<string, string | undefined>)[key];
		if (v) return v;
	}
	// Fallback to Vite env
	try {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const viteEnv = (import.meta as any)?.env as Record<string, string | undefined> | undefined;
		const v = viteEnv?.[key as keyof typeof viteEnv];
		if (v) return v;
	} catch {}
	return fallback;
};

export const APP_TITLE = readEnv("NEXT_PUBLIC_APP_TITLE", readEnv("VITE_APP_TITLE", "Sous")) || "Sous";

export const APP_LOGO =
	readEnv(
		"NEXT_PUBLIC_APP_LOGO",
		readEnv("VITE_APP_LOGO", "https://placehold.co/128x128/E1E7EF/1F2937?text=App"),
	) || "https://placehold.co/128x128/E1E7EF/1F2937?text=App";

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
	if (typeof window === "undefined") {
		// Avoid accessing window during SSR/Route Handlers
		return "/api/oauth/callback";
	}
	const oauthPortalUrl =
		readEnv("NEXT_PUBLIC_OAUTH_PORTAL_URL", readEnv("VITE_OAUTH_PORTAL_URL")) || "";
	const appId = readEnv("NEXT_PUBLIC_APP_ID", readEnv("VITE_APP_ID")) || "";
	// If required envs are missing, avoid constructing an invalid URL.
	if (!oauthPortalUrl || !appId) {
		return "/";
	}
	const redirectUri = `${window.location.origin}/api/oauth/callback`;
	const state = btoa(redirectUri);

	const url = new URL(`${oauthPortalUrl}/app-auth`);
	url.searchParams.set("appId", appId);
	url.searchParams.set("redirectUri", redirectUri);
	url.searchParams.set("state", state);
	url.searchParams.set("type", "signIn");

	return url.toString();
};
