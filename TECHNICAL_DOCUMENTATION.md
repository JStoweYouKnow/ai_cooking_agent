# Sous – Technical Documentation

## Tech Stack

### Frontend (Mobile App)

| Layer | Technology |
|-------|------------|
| **Framework** | React Native 0.81.5 with Expo SDK 54 |
| **Language** | TypeScript 5.9 |
| **State** | TanStack React Query v5 (server state), React Context (auth, theme, RevenueCat) |
| **Navigation** | React Navigation 7 (bottom tabs, native stack) |
| **API Client** | tRPC v11 with superjson |
| **Payments (iOS)** | react-native-purchases (RevenueCat SDK) v9.7 |
| **Payments (Android)** | Stripe (planned) |
| **UI** | Custom components, Expo Linear Gradient, Ionicons |

### Frontend (Web)

| Layer | Technology |
|-------|------------|
| **Framework** | React 19, Next.js |
| **Styling** | Tailwind CSS 4 |
| **Components** | Radix UI |
| **State** | TanStack React Query, tRPC |
| **Routing** | Wouter |

### Backend

| Layer | Technology |
|-------|------------|
| **Runtime** | Node.js |
| **Framework** | Next.js App Router + Express 4 |
| **API** | tRPC 11 (type-safe RPC) |
| **Validation** | Zod |
| **Database** | PostgreSQL with Drizzle ORM |
| **Auth** | OAuth (Manus platform), cookie-based sessions with jose JWT |
| **LLM** | Google Gemini 2.5 Flash (recipe parsing, ingredient recognition, meal planning) |

### Infrastructure

| Service | Technology |
|---------|------------|
| **Hosting** | Vercel (Next.js/API) |
| **Database** | Neon PostgreSQL |
| **Storage** | AWS S3 (recipe images) |
| **CI/CD** | GitHub Actions |
| **Mobile Builds** | EAS Build (Expo Application Services) |
| **Monitoring** | Sentry (react-native, server) |

### Monetization

| Platform | Technology |
|----------|------------|
| **iOS** | RevenueCat (react-native-purchases) |
| **Web / Android** | Stripe |
| **Backend** | Unified subscription layer (single source of truth) |

---

## Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Clients                                        │
├─────────────────────┬─────────────────────┬─────────────────────────┤
│   iOS (Expo/RN)     │   Android (future)  │   Web (Next.js)         │
│   RevenueCat SDK    │   Stripe            │   Stripe                 │
└──────────┬──────────┴──────────┬──────────┴────────────┬────────────┘
           │                     │                        │
           │      tRPC over HTTP │                        │
           └─────────────────────┼────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     Next.js / Express Server                        │
├─────────────────────────────────────────────────────────────────────┤
│  tRPC Routers │ OAuth │ Stripe Checkout │ RevenueCat Webhook         │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     PostgreSQL (Neon)                                │
│  users │ recipes │ ingredients │ shopping_lists │ subscriptions      │
│  payments │ notifications │ ...                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Subscription Flow (Cross-Platform)

```
                    ┌──────────────────────┐
                    │   User Opens App     │
                    └──────────┬───────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
     ┌─────────────┐  ┌─────────────────┐  ┌─────────────┐
     │   iOS      │  │   Web/Android   │  │   Backend   │
     │ RevenueCat │  │   Stripe        │  │   tRPC      │
     │ SDK checks │  │   Checkout      │  │ subscription│
     │ entitlements│  │   Session      │  │ .hasActive   │
     └──────┬─────┘  └────────┬────────┘  └──────┬──────┘
            │                 │                  │
            │                 │                  │
            ▼                 ▼                  ▼
     ┌─────────────────────────────────────────────────┐
     │            useSubscription() Hook                │
     │  Combines: hasIOSSubscription || hasServerSub    │
     │  Single isPremium value for UI/feature gating    │
     └─────────────────────────────────────────────────┘
```

### Data Flow – Recipe to Shopping List

1. **Import:** User pastes URL → tRPC `recipes.parseFromUrl` → LLM or pattern-based parser → structured recipe → stored in `recipes` + `recipe_ingredients`
2. **Shopping List:** User taps "Add to List" → tRPC `shoppingLists.addFromRecipe` → joins `recipe_ingredients` with `ingredients` → measurement converter → grouped by category → stored in `shopping_list_items`
3. **Display:** tRPC `shoppingLists.getItems` → client groups by category (from `ingredients.category` or grocery category mapping)

---

## RevenueCat Implementation

### Overview

Sous uses RevenueCat on iOS to handle in-app purchases (StoreKit) while keeping a single subscription model across web (Stripe) and mobile. The backend stores subscription state from both Stripe and RevenueCat and exposes a unified `subscription.hasActive` API.

### 1. SDK Integration (iOS Only)

- **Package:** `react-native-purchases` v9.7
- **Initialization:** In `RevenueCatContext` when user is authenticated
- **User Identification:** `app_user_id` = server user ID (integer string) for cross-platform sync

**Key files:**
- `mobile/src/services/revenueCat.ts` – SDK wrapper, product IDs, entitlements
- `mobile/src/contexts/RevenueCatContext.tsx` – React context and lifecycle
- `mobile/src/hooks/useSubscription.ts` – Unified subscription hook (RevenueCat + server)

### 2. Product IDs and Entitlements

**App Store product identifiers (configured in App Store Connect):**

| Product | Bundle ID |
|---------|-----------|
| Premium Monthly | `com.aicookingagent.app.premium.monthly` |
| Premium Yearly | `com.aicookingagent.app.premium.yearly` |
| Family Monthly | `com.aicookingagent.app.family.monthly` |
| Family Yearly | `com.aicookingagent.app.family.yearly` |
| Lifetime | `com.aicookingagent.app.lifetime` |

**RevenueCat entitlements:**
- `premium` – Premium and Lifetime products
- `family` – Family plan (higher tier)

### 3. Webhook Integration

RevenueCat sends webhooks to `/api/revenuecat/webhook` for subscription lifecycle events.

**Supported events:**
- `INITIAL_PURCHASE`, `RENEWAL` → active
- `CANCELLATION` → canceled (at period end)
- `UNCANCELLATION` → active
- `NON_RENEWING_PURCHASE` → active (lifetime)
- `EXPIRATION`, `BILLING_ISSUE` → status updates

**Flow:**
1. RevenueCat POSTs JSON with Bearer token auth
2. Server validates `REVENUECAT_WEBHOOK_SECRET`
3. Parses `app_user_id` (server user ID)
4. Maps event type to subscription status
5. Upserts `subscriptions` with RevenueCat fields
6. Creates `payments` record for purchases/renewals

**Key file:** `app/api/revenuecat/webhook/route.ts`

### 4. Database Schema (RevenueCat Fields)

The `subscriptions` table includes RevenueCat-specific columns:

```sql
revenuecatAppUserId          VARCHAR(255)
revenuecatOriginalAppUserId   VARCHAR(255)
revenuecatProductId           VARCHAR(255)
revenuecatOriginalTransactionId VARCHAR(255)
revenuecatPurchaseDate        TIMESTAMP
revenuecatExpirationDate      TIMESTAMP
revenuecatEnvironment         VARCHAR(20)
subscriptionPlatform          VARCHAR(20)  -- 'stripe' | 'revenuecat_ios'
```

**Migration:** `drizzle/0010_add_revenuecat_fields.sql`

### 5. Unified Subscription Layer

**Server:** `db.hasActiveSubscription(userId)` considers:
- `subscription.status` in `['active', 'trialing']`
- For `subscriptionPlatform = 'revenuecat_ios'`, checks `revenuecatExpirationDate` to handle expired subscriptions

**Client:** `useSubscription()`:
- iOS: Reads `hasActiveSubscription` from RevenueCat context
- Server: Calls `trpc.subscription.hasActive.useQuery()`
- `isPremium = hasIOSSubscription || hasServerSubscription`

**Feature gating:** `checkPremiumFeature()` in `useSubscription` enforces free-tier limits (e.g., 10 recipes) and premium-only features (URL import, meal planning).

### 6. Paywall Triggers & Usage Gating

The app uses a **usage-based paywall** that shows a modal after free-tier thresholds are hit:

| Action | Free Threshold | After Threshold |
|--------|---------------|-----------------|
| AI Chat messages | 2 | Paywall modal with creator endorsement |
| URL recipe imports | 1 | Paywall modal with creator endorsement |

**Key file:** `mobile/src/utils/usagePaywall.ts`

- Counters are stored in `AsyncStorage` (per-device, persists across sessions).
- The paywall modal (`PaywallPrompt.tsx`) features an Eitan Bernath hero section with a personalized endorsement to drive conversion.
- Screens that trigger paywalls: `AIAssistantScreen` (before sending), `RecipeListScreen` (after URL import).

### 7. Intro Offer & Countdown

- On the Subscription screen, the app calls `revenueCatService.checkIntroEligibility()` for all product IDs.
- Products with active intro/trial eligibility display an **"Intro offer"** badge.
- The first time the Subscription screen is viewed, a timestamp is saved to `AsyncStorage`.
- A **3-day countdown banner** ("Intro offer ends in X days") is shown on subsequent visits until the window expires.

**Key file:** `mobile/src/screens/Settings/SubscriptionScreen.tsx`

### 8. Entitlement Auto-Refresh

- `RevenueCatContext` subscribes to `AppState` changes.
- When the app transitions to `active` (foreground), `refreshCustomerInfo()` is called automatically.
- This ensures entitlements are current after background purchases, family sharing changes, or subscription renewals without requiring the user to manually refresh.

### 9. Demo Mode (Hackathon Judging)

Set `EXPO_PUBLIC_DEMO_MODE=true` in `mobile/.env` to unlock all premium features without a real subscription. When enabled:
- `useSubscription().isPremium` always returns `true`
- `checkPremiumFeature()` always returns `true`
- All paywall triggers are bypassed

**Key file:** `mobile/src/constants/demo.ts`

### 10. Observability & Breadcrumbs

All critical monetization events are logged as Sentry breadcrumbs via `addBreadcrumb()`:

| Event | Category | Data |
|-------|----------|------|
| RevenueCat init | `entitlement` | `hasActive`, active entitlement keys |
| Package purchased | `purchase` | `active` status |
| Product ID purchased | `purchase` | `productId`, `active` status |
| AI chat sent/received | `ai` | message metadata |
| URL import success | `import` | recipe name presence |

**Key file:** `mobile/src/utils/analytics.ts`

### 11. Restore Purchases

- `RevenueCatContext.restorePurchases()` calls `Purchases.restorePurchases()`
- After restore, `refreshCustomerInfo()` updates local state
- Webhook updates server `subscriptions` asynchronously
- UI can also call `trpc.subscription.get.invalidate()` to refetch from server

### 12. Environment Variables

**iOS app (EAS / app.json):**
- `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY` – RevenueCat public iOS API key

**Server:**
- `REVENUECAT_WEBHOOK_SECRET` – Bearer token for webhook authentication

---

## Additional Features

### Offline Image Cache

Recipe images are cached to the device filesystem using `expo-file-system`. When a recipe card or detail screen loads an image, the resolved URL is hashed and stored locally. On subsequent loads, the cached file is served if available.

**Key file:** `mobile/src/utils/imageUrl.ts` (`resolveImageUrl`, `getImageUriForDisplay`, `cacheImageAfterLoad`)

### Cooking Mode Guardrails

When a user leaves Cooking Mode mid-recipe, the current step index is persisted to `AsyncStorage`. On reopen, a banner offers **"Resume"** (jump to last step) or **"Undo last step"** (go back one). The saved step is cleared when the recipe is marked as cooked.

**Key file:** `mobile/src/screens/Recipes/CookingModeScreen.tsx`

### Smart Pantry Match

When viewing a recipe, the server compares recipe ingredients against the user's pantry (`user_ingredients`). Matches are returned as a `pantryMatch: boolean[]` array. The ingredient list displays a green **"In pantry"** badge with a checkmark next to matched items.

**Key files:** `server/db.ts` (`getPantryIngredientNames`, `getById`), `mobile/src/components/IngredientList.tsx`

### Social Proof Badges

Recipe cards show **"Cooked N times"** when `cookedCount > 0`. The recipe detail screen shows **"Cooked N times by home cooks"** below the description. The count is derived from the `cookedAt` tracking in the database.

**Key files:** `mobile/src/components/RecipeCard.tsx`, `mobile/src/screens/Recipes/RecipeDetailScreen.tsx`

### AI Meal Planning

A tRPC mutation `recipes.generateMealPlan` uses Gemini to generate a weekly meal plan based on saved recipes and user preferences. The Meal Planning screen calls this and renders a day-by-day plan with recipe links.

**Key files:** `server/routers.ts`, `mobile/src/screens/MealPlanning/MealPlanningScreen.tsx`

### Background Prefetch

When recipe cards enter the viewport (40% visibility threshold), `RecipeGrid` automatically:
1. Prefetches the recipe detail via `trpc.recipes.getById.prefetch()`
2. Warms the image cache via `cacheImageAfterLoad()`

This ensures recipe detail screens and images load instantly on tap.

**Key file:** `mobile/src/components/RecipeGrid.tsx`

### Exponential Backoff + Jitter

All tRPC mutations are configured with `retry: 2` and a delay function: `min(1000 * 2^attempt + random jitter, 10000ms)`. This covers AI chat, recipe imports, mark-as-cooked, and purchase-related mutations.

**Key file:** `mobile/src/api/client.ts`

### Cook Nudge Notifications

A daily cron job (`/api/cron/cook-nudge`) finds recipes created 3+ days ago that have never been cooked and sends a push notification via Expo Push. Each recipe is tagged after notification to prevent duplicates.

**Key files:** `app/api/cron/cook-nudge/route.ts`, `server/services/push.ts`, `server/db.ts`

---

## Key API Endpoints (tRPC)

| Procedure | Description |
|-----------|-------------|
| `recipes.list` | List user recipes |
| `recipes.parseFromUrl` | Import recipe from URL |
| `recipes.searchByIngredients` | Search by ingredients |
| `shoppingLists.addFromRecipe` | Add recipe ingredients to list |
| `subscription.get` | Get subscription details |
| `subscription.hasActive` | Check if user has active subscription |
| `ingredients.recognizeFromImage` | AI ingredient recognition |

---

## Project Structure

```
ai_cooking_agent/
├── app/                    # Next.js App Router
│   ├── api/               # API routes (tRPC, OAuth, webhooks)
│   │   ├── revenuecat/    # RevenueCat webhook
│   │   └── stripe/        # Stripe checkout, portal, webhook
│   └── ...
├── client/                 # Web frontend (React)
├── mobile/                 # React Native app (Expo)
│   ├── src/
│   │   ├── api/           # tRPC client
│   │   ├── contexts/      # Auth, RevenueCat, Theme
│   │   ├── hooks/         # useSubscription, etc.
│   │   ├── screens/
│   │   └── services/      # revenueCat.ts
│   └── ...
├── server/                 # Backend logic
│   ├── _core/             # LLM, env, security
│   ├── routers.ts         # tRPC routers
│   └── db.ts              # Database access
├── drizzle/               # Schema and migrations
├── shared/                # Shared types, Stripe constants
└── ...
```

---

## References

- [RevenueCat Webhooks](https://www.revenuecat.com/docs/webhooks)
- [react-native-purchases](https://github.com/RevenueCat/react-native-purchases)
- [Expo EAS Build](https://docs.expo.dev/build/introduction/)
- [tRPC Documentation](https://trpc.io/docs)
- [Drizzle ORM](https://orm.drizzle.team/)
