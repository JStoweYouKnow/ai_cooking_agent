import { AXIOS_TIMEOUT_MS, COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { ForbiddenError } from "@shared/_core/errors";
import axios, { type AxiosInstance } from "axios";
import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import { SignJWT, jwtVerify } from "jose";
import type { User } from "../../drizzle/schema-postgres";
import * as db from "../db";
import { ENV } from "./env";
import type {
  ExchangeTokenRequest,
  ExchangeTokenResponse,
  GetUserInfoResponse,
  GetUserInfoWithJwtRequest,
  GetUserInfoWithJwtResponse,
} from "./types/manusTypes";
// Utility function
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

export type SessionPayload = {
  openId: string;
  appId: string;
  name: string;
};

const EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
const GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
const GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;

class OAuthService {
  constructor(private client: ReturnType<typeof axios.create>) {
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl || "not configured");
    if (!ENV.oAuthServerUrl) {
      console.warn(
        "[OAuth] WARNING: OAUTH_SERVER_URL is not configured. OAuth login will not be available. Email-based authentication will still work."
      );
    }
  }

  private decodeState(state: string): string {
    const redirectUri = atob(state);
    return redirectUri;
  }

  async getTokenByCode(
    code: string,
    state: string
  ): Promise<ExchangeTokenResponse> {
    const payload: ExchangeTokenRequest = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state),
    };

    const { data } = await this.client.post<ExchangeTokenResponse>(
      EXCHANGE_TOKEN_PATH,
      payload
    );

    return data;
  }

  async getUserInfoByToken(
    token: ExchangeTokenResponse
  ): Promise<GetUserInfoResponse> {
    const { data } = await this.client.post<GetUserInfoResponse>(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken,
      }
    );

    return data;
  }
}

const createOAuthHttpClient = (): AxiosInstance =>
  axios.create({
    baseURL: ENV.oAuthServerUrl,
    timeout: AXIOS_TIMEOUT_MS,
  });

class SDKServer {
  private readonly client: AxiosInstance;
  private readonly oauthService: OAuthService;

  constructor(client: AxiosInstance = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }

  private deriveLoginMethod(
    platforms: unknown,
    fallback: string | null | undefined
  ): string | null {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set<string>(
      platforms.filter((p): p is string => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (
      set.has("REGISTERED_PLATFORM_MICROSOFT") ||
      set.has("REGISTERED_PLATFORM_AZURE")
    )
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }

  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(
    code: string,
    state: string
  ): Promise<ExchangeTokenResponse> {
    return this.oauthService.getTokenByCode(code, state);
  }

  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken: string): Promise<GetUserInfoResponse> {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken,
    } as ExchangeTokenResponse);
    const loginMethod = this.deriveLoginMethod(
      (data as any)?.platforms,
      (data as any)?.platform ?? data.platform ?? null
    );
    return {
      ...(data as any),
      platform: loginMethod,
      loginMethod,
    } as GetUserInfoResponse;
  }

  private parseCookies(cookieHeader: string | undefined) {
    if (!cookieHeader) {
      return new Map<string, string>();
    }

    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }

  private getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }

  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(
    openId: string,
    options: { expiresInMs?: number; name?: string } = {}
  ): Promise<string> {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || "",
      },
      options
    );
  }

  async signSession(
    payload: SessionPayload,
    options: { expiresInMs?: number } = {}
  ): Promise<string> {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1000);
    const secretKey = this.getSessionSecret();

    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name,
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime(expirationSeconds)
      .sign(secretKey);
  }

  async verifySession(
    cookieValue: string | undefined | null
  ): Promise<{ openId: string; appId: string; name: string } | null> {
    if (!cookieValue) {
      // This is expected for mobile apps using Bearer token authentication
      // Only log in debug mode to avoid confusion
      if (process.env.NODE_ENV === "development") {
        console.log("[Auth] No session cookie (expected for Bearer token auth)");
      }
      return null;
    }

    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"],
      });
      const { openId, appId, name } = payload as Record<string, unknown>;

      if (
        !isNonEmptyString(openId) ||
        !isNonEmptyString(appId) ||
        !isNonEmptyString(name)
      ) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }

      return {
        openId,
        appId,
        name,
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }

  async getUserInfoWithJwt(
    jwtToken: string
  ): Promise<GetUserInfoWithJwtResponse> {
    const payload: GetUserInfoWithJwtRequest = {
      jwtToken,
      projectId: ENV.appId,
    };

    const { data } = await this.client.post<GetUserInfoWithJwtResponse>(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );

    const loginMethod = this.deriveLoginMethod(
      (data as any)?.platforms,
      (data as any)?.platform ?? data.platform ?? null
    );
    return {
      ...(data as any),
      platform: loginMethod,
      loginMethod,
    } as GetUserInfoWithJwtResponse;
  }

  async authenticateRequest(req: Request): Promise<User> {
    console.log("[Auth] authenticateRequest called");
    
    // Development / mobile flow: allow Authorization header with Bearer token to act as openId
    console.log("[Auth] Attempting to extract Bearer token...");
    const bearerToken = this.extractBearerToken(req);
    
    if (bearerToken) {
      console.log("[Auth] Bearer token found! Using Bearer token authentication, token length:", bearerToken.length);
      try {
        const user = await this.authenticateWithOpenId(bearerToken);
        console.log("[Auth] Bearer token authentication successful, user id:", user.id);
        return user;
      } catch (error: any) {
        console.error("[Auth] Bearer token authentication failed:", error?.message || error);
        console.error("[Auth] Error stack:", error?.stack);
        throw error; // Re-throw to be caught by context
      }
    }
    
    // Log if no Bearer token found (for debugging)
    const authHeader = req.headers.authorization || (req.headers as Record<string, unknown>)["Authorization"];
    console.log("[Auth] No Bearer token found. Auth header:", authHeader ? "present" : "missing", "type:", typeof authHeader);

    // Regular authentication flow (cookie-based)
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);

    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }

    const sessionUserId = session.openId;
    const signedInAt = new Date();
    let user = await db.getUserByOpenId(sessionUserId);

    // If user not in DB, sync from OAuth server automatically
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionCookie ?? "");
        await db.upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt,
        });
        user = await db.getUserByOpenId(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }

    if (!user) {
      throw ForbiddenError("User not found");
    }

    await db.upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt,
    });

    return user;
  }

  private extractBearerToken(req: Request): string | null {
    const header = req.headers.authorization || (req.headers as Record<string, unknown>)["Authorization"];
    console.log("[Auth] extractBearerToken - header type:", typeof header, "header value:", header ? (typeof header === 'string' ? header.substring(0, 50) + '...' : 'not a string') : 'null/undefined');
    
    if (typeof header !== "string") {
      console.log("[Auth] extractBearerToken - header is not a string, returning null");
      return null;
    }
    
    const match = header.match(/^Bearer\s+(.+)$/i);
    if (!match) {
      console.log("[Auth] extractBearerToken - no Bearer match found in header");
      return null;
    }
    
    const token = match[1].trim();
    if (token.length > 0) {
      console.log("[Auth] Bearer token extracted successfully, length:", token.length, "preview:", token.substring(0, 20) + "...");
      return token;
    }
    console.log("[Auth] Bearer token is empty after trim");
    return null;
  }

  private async authenticateWithOpenId(tokenOrOpenId: string): Promise<User> {
    const normalized = tokenOrOpenId.trim();
    if (!normalized) {
      throw ForbiddenError("Invalid bearer token");
    }

    // Try to verify as JWT session token first
    try {
      const session = await this.verifySession(normalized);
      if (session) {
        // Valid session token - use the openId from the session
        const signedInAt = new Date();
        let user = await db.getUserByOpenId(session.openId);

        if (!user) {
          // User not in DB, but we have valid session - create user
          await db.upsertUser({
            openId: session.openId,
            name: session.name || null,
            email: null,
            loginMethod: "oauth",
            lastSignedIn: signedInAt,
          });
          user = await db.getUserByOpenId(session.openId);
        } else {
          await db.upsertUser({
            openId: session.openId,
            lastSignedIn: signedInAt,
          });
        }

        if (!user) {
          throw ForbiddenError("User not found");
        }

        return user;
      }
    } catch (error) {
      // Not a valid JWT, fall through to treat as openId
      console.log("[Auth] Bearer token is not a valid JWT, treating as openId");
    }

    // Fallback: treat as openId (for backward compatibility with email-based auth)
    console.log("[Auth] Treating token as openId:", normalized);
    const signedInAt = new Date();
    let user = await db.getUserByOpenId(normalized);
    console.log("[Auth] getUserByOpenId result:", user ? { id: user.id, openId: user.openId } : "null");

    if (!user) {
      const defaultName = normalized.includes("@")
        ? normalized.split("@")[0]
        : normalized;

      console.log("[Auth] Creating new user with openId:", normalized, "name:", defaultName);
      
      // Check database connection before attempting user creation
      const dbInstance = await db.getDb();
      if (!dbInstance) {
        console.error("[Auth] Database not available for user creation");
        throw ForbiddenError("Database connection not available. Please try again later.");
      }
      
      try {
        await db.upsertUser({
          openId: normalized,
          name: defaultName,
          email: normalized.includes("@") ? normalized : null,
          loginMethod: "mobile-bearer",
          lastSignedIn: signedInAt,
        });
        console.log("[Auth] upsertUser completed, fetching user...");
        user = await db.getUserByOpenId(normalized);
        console.log("[Auth] User after creation:", user ? { id: user.id, openId: user.openId } : "null");
        
        if (!user) {
          console.error("[Auth] User was not created or could not be retrieved after upsertUser");
          throw ForbiddenError("Failed to create or retrieve user. Please try again.");
        }
      } catch (error: any) {
        console.error("[Auth] Error creating user:", error);
        console.error("[Auth] Error details:", {
          message: error?.message,
          stack: error?.stack,
          code: error?.code,
        });
        throw ForbiddenError(`Failed to create user: ${error?.message || "Unknown error"}`);
      }
    } else {
      console.log("[Auth] Existing user found, updating lastSignedIn");
      await db.upsertUser({
        openId: normalized,
        lastSignedIn: signedInAt,
      });
      console.log("[Auth] User updated:", { id: user.id, openId: user.openId });
    }

    if (!user) {
      console.error("[Auth] User is still null after upsert/retrieve - this should not happen");
      throw ForbiddenError("User not found after creation");
    }

    console.log("[Auth] Returning user:", { id: user.id, openId: user.openId, name: user.name });
    return user;
  }
}

export const sdk = new SDKServer();
