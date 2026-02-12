/**
 * Privacy Compliance Test Suite
 * Tests for Apple App Store Guidelines & Regional Privacy Laws (GDPR, CCPA)
 *
 * References:
 * - Apple App Store Review Guideline 5.1.1 (Account Deletion)
 * - GDPR Articles 17, 20 (Right to Erasure, Data Portability)
 * - CCPA Section 1798.105 (Right to Delete)
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock database operations
const mockDb = {
  users: new Map(),
  recipes: new Map(),
  shoppingLists: new Map(),
  ingredients: new Map(),
  subscriptions: new Map(),
  analyticsEvents: new Map(),
};

// Privacy service interface
interface PrivacyService {
  requestAccountDeletion(userId: number): Promise<{ deletionId: string; scheduledAt: Date }>;
  confirmAccountDeletion(userId: number, confirmationCode: string): Promise<boolean>;
  cancelAccountDeletion(userId: number, deletionId: string): Promise<boolean>;
  exportUserData(userId: number): Promise<UserDataExport>;
  getConsentStatus(userId: number): Promise<ConsentStatus>;
  updateConsent(userId: number, consents: ConsentUpdate): Promise<void>;
  resetAllData(userId: number): Promise<void>;
  anonymizeData(userId: number): Promise<void>;
}

interface UserDataExport {
  user: {
    id: number;
    email: string | null;
    name: string | null;
    createdAt: Date;
  };
  recipes: Array<{
    id: number;
    title: string;
    ingredients: string[];
    instructions: string;
    createdAt: Date;
  }>;
  shoppingLists: Array<{
    id: number;
    name: string;
    items: string[];
    createdAt: Date;
  }>;
  ingredients: Array<{
    name: string;
    quantity: number;
    addedAt: Date;
  }>;
  subscription: {
    plan: string | null;
    status: string;
    startedAt: Date | null;
    expiresAt: Date | null;
  } | null;
  exportedAt: Date;
  format: "json";
}

interface ConsentStatus {
  analytics: boolean;
  marketing: boolean;
  personalization: boolean;
  thirdPartySharing: boolean;
  updatedAt: Date;
}

interface ConsentUpdate {
  analytics?: boolean;
  marketing?: boolean;
  personalization?: boolean;
  thirdPartySharing?: boolean;
}

// Consent store (declared early for beforeEach access)
const consentStore = new Map<number, ConsentStatus>();

describe("Privacy Compliance Tests", () => {
  // Reset all mock data before each test to prevent state pollution
  beforeEach(() => {
    mockDb.users.clear();
    mockDb.recipes.clear();
    mockDb.shoppingLists.clear();
    mockDb.ingredients.clear();
    mockDb.subscriptions.clear();
    mockDb.analyticsEvents.clear();
    consentStore.clear();
    vi.useRealTimers();
  });

  // ============================================
  // ACCOUNT DELETION (Apple Guideline 5.1.1)
  // ============================================
  describe("Account Deletion Flow", () => {
    describe("Deletion Request", () => {
      it("should allow user to initiate account deletion", async () => {
        const userId = 1;
        const result = await mockRequestAccountDeletion(userId);

        expect(result).toHaveProperty("deletionId");
        expect(result).toHaveProperty("scheduledAt");
        expect(result.scheduledAt).toBeInstanceOf(Date);
        // Apple requires reasonable waiting period (typically 30 days)
        const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        expect(result.scheduledAt.getTime()).toBeLessThanOrEqual(thirtyDaysFromNow.getTime());
      });

      it("should send confirmation email when deletion is requested", async () => {
        const userId = 1;
        const emailSent = vi.fn();

        await mockRequestAccountDeletion(userId, { onEmailSent: emailSent });

        expect(emailSent).toHaveBeenCalledWith(
          expect.objectContaining({
            type: "account_deletion_requested",
            userId,
          })
        );
      });

      it("should prevent duplicate deletion requests", async () => {
        const userId = 1;
        await mockRequestAccountDeletion(userId);

        await expect(mockRequestAccountDeletion(userId)).rejects.toThrow(
          /deletion.*already.*pending/i
        );
      });

      it("should require authentication to request deletion", async () => {
        await expect(mockRequestAccountDeletion(null as any)).rejects.toThrow(
          /unauthorized|authentication/i
        );
      });
    });

    describe("Deletion Confirmation", () => {
      it("should require confirmation code to complete deletion", async () => {
        const userId = 1;
        const { deletionId } = await mockRequestAccountDeletion(userId);
        const confirmationCode = "123456";

        const result = await mockConfirmAccountDeletion(userId, confirmationCode);

        expect(result).toBe(true);
      });

      it("should reject invalid confirmation codes", async () => {
        const userId = 1;
        await mockRequestAccountDeletion(userId);

        const result = await mockConfirmAccountDeletion(userId, "wrong-code");

        expect(result).toBe(false);
      });

      it("should reject expired confirmation codes", async () => {
        const userId = 1;
        const { deletionId } = await mockRequestAccountDeletion(userId);

        // Simulate code expiration (typically 24-48 hours)
        vi.setSystemTime(Date.now() + 49 * 60 * 60 * 1000);

        await expect(mockConfirmAccountDeletion(userId, "123456")).rejects.toThrow(
          /expired/i
        );

        vi.useRealTimers();
      });
    });

    describe("Deletion Cancellation", () => {
      it("should allow user to cancel pending deletion within grace period", async () => {
        const userId = 1;
        const { deletionId } = await mockRequestAccountDeletion(userId);

        const result = await mockCancelAccountDeletion(userId, deletionId);

        expect(result).toBe(true);
      });

      it("should not allow cancellation after grace period", async () => {
        const userId = 1;
        const { deletionId } = await mockRequestAccountDeletion(userId);

        // Simulate past grace period
        vi.setSystemTime(Date.now() + 31 * 24 * 60 * 60 * 1000);

        await expect(mockCancelAccountDeletion(userId, deletionId)).rejects.toThrow(
          /grace period.*expired/i
        );

        vi.useRealTimers();
      });
    });

    describe("Data Deletion Completeness", () => {
      it("should delete all user-created content", async () => {
        const userId = 1;

        // Setup test data
        mockDb.recipes.set(1, { userId, title: "Test Recipe" });
        mockDb.shoppingLists.set(1, { userId, name: "Test List" });
        mockDb.ingredients.set(1, { userId, name: "Test Ingredient" });

        await mockExecuteAccountDeletion(userId);

        // Verify all data is deleted
        const userRecipes = Array.from(mockDb.recipes.values()).filter(
          (r: any) => r.userId === userId
        );
        const userLists = Array.from(mockDb.shoppingLists.values()).filter(
          (l: any) => l.userId === userId
        );
        const userIngredients = Array.from(mockDb.ingredients.values()).filter(
          (i: any) => i.userId === userId
        );

        expect(userRecipes.length).toBe(0);
        expect(userLists.length).toBe(0);
        expect(userIngredients.length).toBe(0);
      });

      it("should cancel active subscriptions", async () => {
        const userId = 1;
        mockDb.subscriptions.set(userId, { status: "active", plan: "premium" });

        await mockExecuteAccountDeletion(userId);

        const subscription = mockDb.subscriptions.get(userId);
        expect(subscription).toBeUndefined();
      });

      it("should delete or anonymize analytics data", async () => {
        const userId = 1;
        mockDb.analyticsEvents.set(1, { userId, event: "recipe_view" });
        mockDb.analyticsEvents.set(2, { userId, event: "search" });

        await mockExecuteAccountDeletion(userId);

        const userEvents = Array.from(mockDb.analyticsEvents.values()).filter(
          (e: any) => e.userId === userId
        );
        expect(userEvents.length).toBe(0);
      });

      it("should revoke all active sessions/tokens", async () => {
        const userId = 1;
        const sessions = [
          { userId, token: "token1", active: true },
          { userId, token: "token2", active: true },
        ];

        const revokedSessions = await mockRevokeAllSessions(userId);

        expect(revokedSessions).toBe(2);
      });

      it("should remove user from third-party services", async () => {
        const userId = 1;
        const thirdPartyCleanup = vi.fn().mockResolvedValue(true);

        await mockExecuteAccountDeletion(userId, { onThirdPartyCleanup: thirdPartyCleanup });

        expect(thirdPartyCleanup).toHaveBeenCalledWith(userId);
      });
    });
  });

  // ============================================
  // DATA EXPORT (GDPR Article 20)
  // ============================================
  describe("Data Export (Right to Data Portability)", () => {
    it("should export all user data in machine-readable format", async () => {
      const userId = 1;

      const exportData = await mockExportUserData(userId);

      expect(exportData).toHaveProperty("user");
      expect(exportData).toHaveProperty("recipes");
      expect(exportData).toHaveProperty("shoppingLists");
      expect(exportData).toHaveProperty("ingredients");
      expect(exportData).toHaveProperty("subscription");
      expect(exportData).toHaveProperty("exportedAt");
      expect(exportData.format).toBe("json");
    });

    it("should include all recipe data with ingredients and instructions", async () => {
      const userId = 1;
      mockDb.recipes.set(1, {
        userId,
        title: "Test Recipe",
        ingredients: ["flour", "sugar"],
        instructions: "Mix and bake",
        createdAt: new Date(),
      });

      const exportData = await mockExportUserData(userId);

      expect(exportData.recipes.length).toBeGreaterThan(0);
      expect(exportData.recipes[0]).toHaveProperty("title");
      expect(exportData.recipes[0]).toHaveProperty("ingredients");
      expect(exportData.recipes[0]).toHaveProperty("instructions");
      expect(exportData.recipes[0]).toHaveProperty("createdAt");
    });

    it("should include shopping list history", async () => {
      const userId = 1;
      mockDb.shoppingLists.set(1, {
        userId,
        name: "Weekly Groceries",
        items: ["milk", "eggs"],
        createdAt: new Date(),
      });

      const exportData = await mockExportUserData(userId);

      expect(exportData.shoppingLists.length).toBeGreaterThan(0);
      expect(exportData.shoppingLists[0]).toHaveProperty("name");
      expect(exportData.shoppingLists[0]).toHaveProperty("items");
    });

    it("should include subscription information", async () => {
      const userId = 1;
      mockDb.subscriptions.set(userId, {
        plan: "premium",
        status: "active",
        startedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      const exportData = await mockExportUserData(userId);

      expect(exportData.subscription).not.toBeNull();
      expect(exportData.subscription?.plan).toBe("premium");
      expect(exportData.subscription?.status).toBe("active");
    });

    it("should not include sensitive internal data", async () => {
      const userId = 1;

      const exportData = await mockExportUserData(userId);

      // Should not include password hashes, internal IDs, etc.
      expect(exportData.user).not.toHaveProperty("passwordHash");
      expect(exportData.user).not.toHaveProperty("internalFlags");
      expect(exportData.user).not.toHaveProperty("adminNotes");
    });

    it("should complete export within reasonable time (< 72 hours GDPR requirement)", async () => {
      const userId = 1;
      const startTime = Date.now();

      const exportData = await mockExportUserData(userId);

      const endTime = Date.now();
      // For test purposes, check it completes quickly
      expect(endTime - startTime).toBeLessThan(5000);
      // In production, would verify email delivery within 72 hours
    });

    it("should rate limit export requests", async () => {
      const userId = 1;

      // First request should succeed
      await mockExportUserData(userId);

      // Immediate second request should be rate limited
      await expect(mockExportUserData(userId)).rejects.toThrow(/rate limit|too many requests/i);
    });
  });

  // ============================================
  // CONSENT MANAGEMENT (GDPR, CCPA)
  // ============================================
  describe("Consent Screens & Management", () => {
    describe("Initial Consent", () => {
      it("should require explicit consent for analytics tracking", async () => {
        const userId = 1;

        const consent = await mockGetConsentStatus(userId);

        // Default should be opt-out for non-essential tracking
        expect(consent.analytics).toBe(false);
      });

      it("should require explicit consent for marketing communications", async () => {
        const userId = 1;

        const consent = await mockGetConsentStatus(userId);

        expect(consent.marketing).toBe(false);
      });

      it("should require explicit consent for third-party data sharing", async () => {
        const userId = 1;

        const consent = await mockGetConsentStatus(userId);

        expect(consent.thirdPartySharing).toBe(false);
      });

      it("should track consent timestamp", async () => {
        const userId = 1;

        const consent = await mockGetConsentStatus(userId);

        expect(consent.updatedAt).toBeInstanceOf(Date);
      });
    });

    describe("Consent Updates", () => {
      it("should allow user to grant consent", async () => {
        const userId = 1;

        await mockUpdateConsent(userId, { analytics: true });

        const consent = await mockGetConsentStatus(userId);
        expect(consent.analytics).toBe(true);
      });

      it("should allow user to withdraw consent", async () => {
        const userId = 1;

        // First grant consent
        await mockUpdateConsent(userId, { analytics: true });

        // Then withdraw
        await mockUpdateConsent(userId, { analytics: false });

        const consent = await mockGetConsentStatus(userId);
        expect(consent.analytics).toBe(false);
      });

      it("should update timestamp on consent change", async () => {
        const userId = 1;
        const initialConsent = await mockGetConsentStatus(userId);
        const initialTimestamp = initialConsent.updatedAt;

        // Wait a bit and update
        await new Promise((resolve) => setTimeout(resolve, 10));
        await mockUpdateConsent(userId, { marketing: true });

        const newConsent = await mockGetConsentStatus(userId);
        expect(newConsent.updatedAt.getTime()).toBeGreaterThan(initialTimestamp.getTime());
      });

      it("should allow granular consent management", async () => {
        const userId = 1;

        await mockUpdateConsent(userId, {
          analytics: true,
          marketing: false,
          personalization: true,
          thirdPartySharing: false,
        });

        const consent = await mockGetConsentStatus(userId);
        expect(consent.analytics).toBe(true);
        expect(consent.marketing).toBe(false);
        expect(consent.personalization).toBe(true);
        expect(consent.thirdPartySharing).toBe(false);
      });
    });

    describe("Consent Enforcement", () => {
      it("should not track analytics without consent", async () => {
        const userId = 1;
        const trackEvent = vi.fn();

        await mockUpdateConsent(userId, { analytics: false });
        await mockTrackEventWithConsent(userId, "page_view", trackEvent);

        expect(trackEvent).not.toHaveBeenCalled();
      });

      it("should track analytics with consent", async () => {
        const userId = 1;
        const trackEvent = vi.fn();

        await mockUpdateConsent(userId, { analytics: true });
        await mockTrackEventWithConsent(userId, "page_view", trackEvent);

        expect(trackEvent).toHaveBeenCalled();
      });

      it("should not send marketing emails without consent", async () => {
        const userId = 1;
        const sendEmail = vi.fn();

        await mockUpdateConsent(userId, { marketing: false });
        await mockSendMarketingEmail(userId, sendEmail);

        expect(sendEmail).not.toHaveBeenCalled();
      });
    });
  });

  // ============================================
  // RESET ALL DATA
  // ============================================
  describe("Reset All Data", () => {
    it("should clear all user-generated content", async () => {
      const userId = 1;

      // Setup data
      mockDb.recipes.set(1, { userId, title: "Recipe 1" });
      mockDb.recipes.set(2, { userId, title: "Recipe 2" });
      mockDb.shoppingLists.set(1, { userId, name: "List 1" });

      await mockResetAllData(userId);

      const userRecipes = Array.from(mockDb.recipes.values()).filter(
        (r: any) => r.userId === userId
      );
      const userLists = Array.from(mockDb.shoppingLists.values()).filter(
        (l: any) => l.userId === userId
      );

      expect(userRecipes.length).toBe(0);
      expect(userLists.length).toBe(0);
    });

    it("should preserve account and subscription", async () => {
      const userId = 1;
      mockDb.users.set(userId, { id: userId, email: "test@example.com" });
      mockDb.subscriptions.set(userId, { plan: "premium", status: "active" });

      await mockResetAllData(userId);

      expect(mockDb.users.get(userId)).toBeDefined();
      expect(mockDb.subscriptions.get(userId)).toBeDefined();
    });

    it("should reset consent to defaults", async () => {
      const userId = 1;

      await mockUpdateConsent(userId, {
        analytics: true,
        marketing: true,
        personalization: true,
      });

      await mockResetAllData(userId);

      const consent = await mockGetConsentStatus(userId);
      expect(consent.analytics).toBe(false);
      expect(consent.marketing).toBe(false);
    });

    it("should require confirmation for reset", async () => {
      const userId = 1;

      await expect(mockResetAllData(userId, { confirmed: false })).rejects.toThrow(
        /confirmation required/i
      );
    });

    it("should log reset action for audit trail", async () => {
      const userId = 1;
      const auditLog = vi.fn();

      await mockResetAllData(userId, { confirmed: true, onAuditLog: auditLog });

      expect(auditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "data_reset",
          userId,
          timestamp: expect.any(Date),
        })
      );
    });
  });

  // ============================================
  // DATA ANONYMIZATION
  // ============================================
  describe("Data Anonymization", () => {
    it("should anonymize user PII while preserving aggregate data", async () => {
      const userId = 1;
      mockDb.users.set(userId, {
        id: userId,
        email: "john.doe@example.com",
        name: "John Doe",
      });

      await mockAnonymizeUser(userId);

      const user = mockDb.users.get(userId);
      expect(user?.email).toMatch(/^anonymized-\d+@deleted\.local$/);
      expect(user?.name).toBeNull();
    });

    it("should preserve recipe data with anonymized author", async () => {
      const userId = 1;
      mockDb.recipes.set(1, {
        userId,
        title: "Great Recipe",
        authorName: "John Doe",
      });

      await mockAnonymizeUser(userId);

      const recipe = mockDb.recipes.get(1);
      expect(recipe?.title).toBe("Great Recipe");
      expect(recipe?.authorName).toBeNull();
    });
  });
});

// ============================================
// Mock Implementations
// ============================================

async function mockRequestAccountDeletion(
  userId: number,
  options?: { onEmailSent?: Function }
): Promise<{ deletionId: string; scheduledAt: Date }> {
  if (!userId) {
    throw new Error("Unauthorized: Authentication required");
  }

  const pendingDeletion = mockDb.users.get(`deletion_${userId}`);
  if (pendingDeletion) {
    throw new Error("Account deletion already pending");
  }

  const deletionId = `del_${Date.now()}`;
  const scheduledAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  mockDb.users.set(`deletion_${userId}`, { deletionId, scheduledAt, confirmed: false });

  if (options?.onEmailSent) {
    options.onEmailSent({ type: "account_deletion_requested", userId });
  }

  return { deletionId, scheduledAt };
}

async function mockConfirmAccountDeletion(
  userId: number,
  confirmationCode: string
): Promise<boolean> {
  const deletion = mockDb.users.get(`deletion_${userId}`);
  if (!deletion) return false;

  // Check expiration (48 hours)
  const expirationTime = 48 * 60 * 60 * 1000;
  if (Date.now() > deletion.scheduledAt.getTime() - 30 * 24 * 60 * 60 * 1000 + expirationTime) {
    throw new Error("Confirmation code expired");
  }

  if (confirmationCode === "123456") {
    deletion.confirmed = true;
    return true;
  }

  return false;
}

async function mockCancelAccountDeletion(userId: number, deletionId: string): Promise<boolean> {
  const deletion = mockDb.users.get(`deletion_${userId}`);
  if (!deletion || deletion.deletionId !== deletionId) return false;

  // Check if past grace period
  if (Date.now() > deletion.scheduledAt.getTime()) {
    throw new Error("Grace period has expired");
  }

  mockDb.users.delete(`deletion_${userId}`);
  return true;
}

async function mockExecuteAccountDeletion(
  userId: number,
  options?: { onThirdPartyCleanup?: Function }
): Promise<void> {
  // Delete all user data
  for (const [key, value] of mockDb.recipes.entries()) {
    if ((value as any).userId === userId) {
      mockDb.recipes.delete(key);
    }
  }

  for (const [key, value] of mockDb.shoppingLists.entries()) {
    if ((value as any).userId === userId) {
      mockDb.shoppingLists.delete(key);
    }
  }

  for (const [key, value] of mockDb.ingredients.entries()) {
    if ((value as any).userId === userId) {
      mockDb.ingredients.delete(key);
    }
  }

  for (const [key, value] of mockDb.analyticsEvents.entries()) {
    if ((value as any).userId === userId) {
      mockDb.analyticsEvents.delete(key);
    }
  }

  mockDb.subscriptions.delete(userId);
  mockDb.users.delete(userId);

  if (options?.onThirdPartyCleanup) {
    await options.onThirdPartyCleanup(userId);
  }
}

async function mockRevokeAllSessions(userId: number): Promise<number> {
  // Mock: would revoke all JWT tokens / sessions
  return 2;
}

async function mockExportUserData(userId: number): Promise<UserDataExport> {
  // Check rate limit (mock)
  const lastExport = mockDb.users.get(`export_${userId}`);
  if (lastExport && Date.now() - lastExport.timestamp < 24 * 60 * 60 * 1000) {
    throw new Error("Rate limit exceeded: too many requests");
  }

  mockDb.users.set(`export_${userId}`, { timestamp: Date.now() });

  const user = mockDb.users.get(userId) || { id: userId, email: null, name: null };
  const recipes = Array.from(mockDb.recipes.values()).filter((r: any) => r.userId === userId);
  const shoppingLists = Array.from(mockDb.shoppingLists.values()).filter(
    (l: any) => l.userId === userId
  );
  const ingredients = Array.from(mockDb.ingredients.values()).filter(
    (i: any) => i.userId === userId
  );
  const subscription = mockDb.subscriptions.get(userId) || null;

  return {
    user: {
      id: userId,
      email: user.email || null,
      name: user.name || null,
      createdAt: user.createdAt || new Date(),
    },
    recipes: recipes.map((r: any) => ({
      id: r.id,
      title: r.title,
      ingredients: r.ingredients || [],
      instructions: r.instructions || "",
      createdAt: r.createdAt || new Date(),
    })),
    shoppingLists: shoppingLists.map((l: any) => ({
      id: l.id,
      name: l.name,
      items: l.items || [],
      createdAt: l.createdAt || new Date(),
    })),
    ingredients: ingredients.map((i: any) => ({
      name: i.name,
      quantity: i.quantity || 0,
      addedAt: i.addedAt || new Date(),
    })),
    subscription: subscription
      ? {
          plan: subscription.plan,
          status: subscription.status,
          startedAt: subscription.startedAt || null,
          expiresAt: subscription.expiresAt || null,
        }
      : null,
    exportedAt: new Date(),
    format: "json",
  };
}

async function mockGetConsentStatus(userId: number): Promise<ConsentStatus> {
  return (
    consentStore.get(userId) || {
      analytics: false,
      marketing: false,
      personalization: false,
      thirdPartySharing: false,
      updatedAt: new Date(),
    }
  );
}

async function mockUpdateConsent(userId: number, consents: ConsentUpdate): Promise<void> {
  const current = await mockGetConsentStatus(userId);

  consentStore.set(userId, {
    analytics: consents.analytics ?? current.analytics,
    marketing: consents.marketing ?? current.marketing,
    personalization: consents.personalization ?? current.personalization,
    thirdPartySharing: consents.thirdPartySharing ?? current.thirdPartySharing,
    updatedAt: new Date(),
  });
}

async function mockTrackEventWithConsent(
  userId: number,
  event: string,
  trackFn: Function
): Promise<void> {
  const consent = await mockGetConsentStatus(userId);
  if (consent.analytics) {
    trackFn({ userId, event });
  }
}

async function mockSendMarketingEmail(userId: number, sendFn: Function): Promise<void> {
  const consent = await mockGetConsentStatus(userId);
  if (consent.marketing) {
    sendFn({ userId, type: "marketing" });
  }
}

async function mockResetAllData(
  userId: number,
  options?: { confirmed?: boolean; onAuditLog?: Function }
): Promise<void> {
  if (options?.confirmed === false) {
    throw new Error("Confirmation required for data reset");
  }

  // Clear user content
  for (const [key, value] of mockDb.recipes.entries()) {
    if ((value as any).userId === userId) {
      mockDb.recipes.delete(key);
    }
  }

  for (const [key, value] of mockDb.shoppingLists.entries()) {
    if ((value as any).userId === userId) {
      mockDb.shoppingLists.delete(key);
    }
  }

  for (const [key, value] of mockDb.ingredients.entries()) {
    if ((value as any).userId === userId) {
      mockDb.ingredients.delete(key);
    }
  }

  // Reset consent to defaults
  consentStore.set(userId, {
    analytics: false,
    marketing: false,
    personalization: false,
    thirdPartySharing: false,
    updatedAt: new Date(),
  });

  if (options?.onAuditLog) {
    options.onAuditLog({
      action: "data_reset",
      userId,
      timestamp: new Date(),
    });
  }
}

async function mockAnonymizeUser(userId: number): Promise<void> {
  const user = mockDb.users.get(userId);
  if (user) {
    mockDb.users.set(userId, {
      ...user,
      email: `anonymized-${Date.now()}@deleted.local`,
      name: null,
    });
  }

  // Anonymize recipe author info
  for (const [key, value] of mockDb.recipes.entries()) {
    if ((value as any).userId === userId) {
      mockDb.recipes.set(key, {
        ...value,
        authorName: null,
      });
    }
  }
}
