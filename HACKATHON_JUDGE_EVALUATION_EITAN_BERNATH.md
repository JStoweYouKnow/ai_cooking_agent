# RevenueCat Shipyard 2026 — Judge Evaluation

**Creator Brief:** #1 Eitan Bernath — Turning Recipe Inspiration into Real Meals  
**Submission:** Sous — AI-Powered Cooking Assistant (iOS)  
**Evaluation Date:** February 5, 2026 (Updated)  
**Judge:** Hackathon Evaluation

---

## Stage One: Eligibility (Pass/Fail)

**Theme Fit:** ✅ **PASS**  
The app reasonably fits the theme. It is a food/lifestyle app targeting home cooks overwhelmed by saved recipes, aligned with Eitan Bernath’s brief.

**Required APIs/SDKs:** ✅ **PASS**  
The project uses the RevenueCat SDK for in-app purchases. Integration includes:
- `react-native-purchases` (RevenueCat SDK)
- `Purchases.configure()` with API key
- Entitlement-based gating
- Restore purchases
- User identification via `Purchases.logIn()`

**Verdict:** **PASS** — Proceeds to Stage Two.

---

## Stage Two: Detailed Scoring

### 1. Audience Fit (30%)

**Criterion:** How well does the app serve the influencer’s specific audience?

**Eitan’s Brief:**  
People save recipes constantly but rarely cook them. Target: home cooks overwhelmed by saved recipes. Need: go from “I want to make this” to “I cooked it” — tools that generate grocery lists from recipe videos or links, organize inspiration, and simplify idea → execution.

**Evaluation:**

| Brief Requirement | Implementation | Alignment |
|-------------------|----------------|-----------|
| Generate grocery lists from recipe videos or links | URL import (YouTube, TikTok, Instagram) → parsed recipe → one-tap shopping list | ✅ Strong |
| Organize cooking inspiration | Recipe saves, collections, multi-source search (TheMealDB, Epicurious, Delish, NYTCooking) | ✅ Strong |
| Simplify path from idea to execution | Import → parse → shop list → cooking mode → mark as cooked | ✅ Strong |
| “I want to make this” → “I cooked it” | “Mark as Cooked,” cooking stats, streaks, achievements | ✅ Strong |
| Video URL support | Dedicated parsers for YouTube, TikTok, Instagram (transcripts, metadata) | ✅ Strong |

**Strengths:**
- Directly addresses the brief’s problem.
- Video support (YouTube, TikTok, Instagram) with transcript extraction.
- Shopping lists generated from recipes, including grocery categories.
- Cooking mode (step-by-step) and completion tracking.
- Pantry-based discovery and AI chat support the “actually cook it” goal.
- **“Share I cooked this”** — Users can share cooking achievements to social/messages (addresses prior gap).

**Minor Gaps:**
- No community or recipe-sharing with other app users (not essential for the brief).

**Score: 9.5/10**

---

### 2. User Experience (25%)

**Criterion:** Is the app intuitive, polished, and enjoyable to use?

**Evaluation:**

| Area | Assessment |
|------|-------------|
| Onboarding | Multi-screen flow with progress, skip option, feature highlights, **full VoiceOver labels** |
| Navigation | Bottom tabs, stack navigation, consistent back handling |
| Premium gating | Usage indicators (e.g., “3 of 10 recipes”), inline and modal paywalls, clear upgrade paths |
| Design system | GlassCard, GradientButton, BottomSheet, consistent layout |
| Feedback | Haptic feedback, loading skeletons, empty states with CTAs |
| Cooking mode | Step-by-step, voice guidance, smart timers, haptics, completion celebration |
| Theme | Light/dark/system support |
| **Accessibility** | **Deep VoiceOver coverage** — Cooking mode, AI chat, onboarding, paywall, cooking steps |
| **Error handling** | **Retry options** on AI chat, mark as cooked, toggle favorite, delete recipe |

**Strengths:**
- Clear upgrade prompts (e.g., recipe limits).
- Creator endorsement on subscription screen.
- Cooking completion flow (celebration, confetti, haptics).
- Voice-guided cooking for hands-free use.
- Dark mode and accessibility support.
- **VoiceOver labels on all key flows** (cooking mode, voice commands, timers, steps, completion modal, AI chat, onboarding).
- **Retry mechanisms** for network-dependent mutations.

**Score: 9.5/10**

---

### 3. Monetization Potential (20%)

**Criterion:** Is the subscription model compelling and sustainable?

**Evaluation:**

| Element | Implementation |
|---------|----------------|
| RevenueCat integration | Configured, entitlement checks, restore purchases, user ID mapping |
| Tiers | Premium ($4.99/mo, $49.99/yr), Family ($9.99/mo, $99.99/yr), Lifetime ($149.99) |
| Free limits | 10 recipes, 5 URL imports, 3 AI recipes/month |
| Value proposition | Unlimited saves, imports, AI features, ad-free |
| Gating | Recipe, import, and AI limits enforced |
| Restore purchases | Present (App Store compliant) |

**Strengths:**
- Multiple tiers with clear value.
- Entitlement-based gating in code.
- Subscription screen with creator endorsement.
- Free tier limits are meaningful and understandable.

**Score: 9.0/10**

---

### 4. Innovation (15%)

**Criterion:** Does the app offer unique features or a fresh approach?

**Evaluation:**

| Feature | Innovation Level |
|---------|------------------|
| Video recipe import (YT, TikTok, IG) | High — not common in cooking apps |
| AI recipe parsing from URLs | High |
| Pantry-based discovery | Medium–high |
| Voice-guided cooking mode | High |
| Smart timer detection in steps | High |
| Cooking streaks and achievements | Medium (gamification) |
| “Mark as Cooked” completion loop | High — closes inspiration → execution loop |
| **“Share I cooked this”** | **Medium** — social sharing of achievements |
| Multi-source aggregation | Medium |

**Strengths:**
- Full flow: save → parse → shop → cook → track → share.
- Video URL support with transcripts.
- Voice + smart timers in cooking mode.
- Streaks and badges support habit formation.
- Share option reinforces “I cooked it” moment.

**Score: 9.3/10**

---

### 5. Technical Quality (10%)

**Criterion:** Is the app stable, performant, and well-built?

**Evaluation:**

| Aspect | Assessment |
|--------|-------------|
| Stack | React Native (Expo 54), TypeScript, tRPC, React Query |
| RevenueCat | Service layer, context provider, error handling |
| Production | Sentry, analytics, OTA updates, offline caching |
| Code quality | TypeScript, error boundaries, clear structure |
| Dependencies | Up-to-date stack (RevenueCat SDK 9.7.1) |
| **API completeness** | **recipes.markAsCooked** procedure implemented |
| **Resilience** | Retry options on key mutations |

**Strengths:**
- Clean separation of concerns.
- Robust handling of RevenueCat edge cases.
- Offline recipe caching.
- E2E coverage for main flows.
- Complete backend support for “Mark as Cooked.”
- User-friendly retry flows when operations fail.

**Score: 9.3/10**

---

## Final Score Summary

| Criteria | Weight | Raw Score | Weighted |
|----------|--------|-----------|----------|
| Audience Fit | 30% | 9.5/10 | 2.85 |
| User Experience | 25% | 9.5/10 | 2.38 |
| Monetization Potential | 20% | 9.0/10 | 1.80 |
| Innovation | 15% | 9.3/10 | 1.40 |
| Technical Quality | 10% | 9.3/10 | 0.93 |
| **TOTAL** | **100%** | — | **9.36/10** |

---

## Overall Assessment

**Final Score: 9.4/10** ↑ (was 9.2)

Sous is a strong submission for Eitan Bernath’s brief. It closely matches the creator’s problem and audience, implements core brief features (including video URL import), and provides an end-to-end flow from inspiration to cooked meal with gamification and monetization. The RevenueCat integration is production-ready and well-structured.

**Improvements since prior evaluation:**
- **Social sharing** — “Share I cooked this” in cooking completion flow.
- **VoiceOver** — Accessibility labels across cooking mode, AI chat, onboarding, paywall, and steps.
- **Error handling** — Retry options on AI chat, mark as cooked, toggle favorite, delete recipe.
- **Backend** — `recipes.markAsCooked` procedure added; flow now fully functional end-to-end.

**Key Differentiators:**
1. Video URL import (YouTube, TikTok, Instagram) with transcript-based parsing.
2. “Mark as Cooked” and completion tracking to close the inspiration → execution loop.
3. Voice-guided cooking and smart timers for hands-free use.
4. Cooking streaks and achievements for habit formation.
5. “Share I cooked this” for social sharing of achievements.

**Recommended Focus for Demo Video:**
- Show full journey: video URL import → parsed recipe → shopping list → cooking mode → “I cooked it” completion → Share.
- Call out Eitan’s quote: “People save recipes constantly — but rarely cook them.”
- Include a clear premium upgrade moment and RevenueCat integration.

---

*This evaluation follows the RevenueCat Shipyard 2026 Official Rules and Judging Criteria.*
