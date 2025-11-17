import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";
import type { NextRequest } from "next/server";

function isSecureRequest(req: NextRequest) {
	const proto = req.headers.get("x-forwarded-proto") || "";
	return proto.split(",").some(p => p.trim().toLowerCase() === "https");
}

export function getNextSessionCookieOptions(
	req: NextRequest,
): Pick<ResponseCookie, "httpOnly" | "path" | "sameSite" | "secure"> {
	return {
		httpOnly: true,
		path: "/",
		sameSite: "none",
		secure: isSecureRequest(req),
	};
}


