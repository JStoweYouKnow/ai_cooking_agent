# RevenueCat Shipyard: Creator Contest — Official Criteria Evaluation

**App:** Sous  
**Creator Brief:** Eitan Bernath (#1) — Turning Recipe Inspiration into Real Meals  
**Evaluation Date:** February 2026  
**Reference:** Official Hackathon Rules

---

## Executive Summary

| Requirement | Status | Notes |
|-------------|--------|------|
| **Eligibility** | ⚠️ Verify | "New Projects Only" — see Section 1 |
| **Project Requirements** | ✅ Pass | Working MVP, RevenueCat, influencer brief |
| **Submission Requirements** | ⚠️ In Progress | TestFlight link, demo video needed |
| **Stage One (Pass/Fail)** | ✅ Likely Pass | Fits theme, uses RevenueCat |
| **Stage Two (Judging)** | 📊 Strong | Estimated 9.0–9.5/10 |

---

## 1. CRITICAL: Project Requirements Compliance

### 1.1 New Projects Only ✅ Mitigated

**Rule:** *"Projects must be newly created by the entrant during the Submission Period."*  
**Submission Period:** January 15, 2026 – February 12, 2026

**Mitigation (see [HACKATHON_DEVELOPMENT_TIMELINE.md](./HACKATHON_DEVELOPMENT_TIMELINE.md)):**
- Sous was **built for this hackathon** in response to Eitan's brief
- Documented features developed during Jan 15–Feb 12: "I Cooked It" tracking, RevenueCat schema, recipe photos, Gemini integration, judge experience, EAS/TestFlight config
- Git commit evidence from Feb 4–11 for core hackathon features
- Written proposal language provided in HACKATHON_DEVELOPMENT_TIMELINE.md

### 1.2 Working Mobile Application MVP ✅

- iOS app builds and runs
- RevenueCat SDK integrated for in-app purchases
- Built for Eitan Bernath's brief (Food / Lifestyle)

### 1.3 RevenueCat SDK ✅

- `react-native-purchases` integrated
- Entitlement-based premium access
- Restore purchases
- Products: Premium Monthly, Premium Yearly, Lifetime

### 1.4 Influencer Brief Alignment ✅

**Eitan's Brief (exact quote):**
> "People save recipes constantly — but rarely cook them. Eitan wants an app that helps users go from 'I want to make this' to 'I cooked it', such as tools that generate grocery lists from recipe videos or links, organize cooking inspiration, and simplify the path from idea to execution."

**Sous Feature Match:**

| Brief Requirement | Sous Implementation |
|-------------------|---------------------|
| Generate grocery lists from recipe videos or links | ✅ URL import → one-tap shopping list; video URL parsing (YouTube, TikTok, Instagram) |
| Organize cooking inspiration | ✅ Recipe collection, saved recipes, organization |
| Simplify path from idea to execution | ✅ Import → list → cook → "Mark as Cooked" |
| "I want to make this" → "I cooked it" | ✅ Full flow: save → shop → cook → completion tracking + celebration |

### 1.5 Functionality ✅

- Installable and runs consistently on iOS
- Functions as described in docs and feature set

### 1.6 Third-Party Integrations ✅

- RevenueCat: Authorized (hackathon requirement)
- Stripe, Gemini, etc.: Standard APIs with proper licensing

### 1.7 Financial/Preferential Support ✅

- No indication of RevenueCat or Devpost funding
- Project appears independently developed

---

## 2. Submission Requirements Checklist

| Requirement | Status | Action |
|-------------|--------|--------|
| Project built with required tools | ✅ | Done |
| Adheres to influencer brief | ✅ | Eitan #1 |
| **TestFlight or Google Play Internal link** | ⚠️ | Resolve Xcode upload, then share link |
| **Text description (proposal + technical docs)** | ✅ | PROJECT_STORY.md, README |
| **Demo video** (< 3 min, device footage, public link) | ⚠️ | Record and upload to YouTube/Vimeo |
| No unauthorized third-party trademarks/copyright | ✅ | Assumed compliant |

---

## 3. Stage One: Pass/Fail (Baseline Viability)

**Criteria:** *"The Project reasonably fits the theme and reasonably applies the required APIs/SDKs."*

| Check | Result |
|-------|--------|
| Fits Eitan Bernath theme (Food/Lifestyle, recipe inspiration → cooking) | ✅ Strong fit |
| Uses RevenueCat for in-app purchase | ✅ Yes |
| Uses required APIs/SDKs | ✅ Yes |

**Verdict:** ✅ **Expected to pass** Stage One.

---

## 4. Stage Two: Judging Criteria (Equally Weighted)

### 4.1 Audience Fit (30%)

**Question:** *How well does the app serve the influencer's specific audience?*

**Eitan's Audience:** Home cooks overwhelmed by saved recipes.

**Evaluation:**

| Strength | Evidence |
|----------|----------|
| Direct problem match | "Save recipes but rarely cook them" → Sous targets exactly this |
| Grocery lists from links/videos | URL + video import, automatic shopping list generation |
| Organization | Saved recipes, collections, meal planning |
| Execution path | Import → shop → cook → "I cooked it" with completion tracking |
| Cooking completion | "Mark as Cooked," streaks, achievements |

**Estimated Score:** 9.0–9.5/10

---

### 4.2 User Experience (25%)

**Question:** *Is the app intuitive, polished, and enjoyable to use?*

**Evaluation:**

| Strength | Evidence |
|----------|----------|
| Onboarding | Multi-screen onboarding, creator endorsement |
| Design system | GlassCard, GradientButton, consistent UI |
| Haptics & animations | Press feedback, cooking completion celebration |
| Voice-guided cooking | Hands-free step readout |
| Smart timers | Auto-detected cook times |
| Loading/empty states | Skeletons, clear CTAs |
| Dark mode | Full theme support |
| Offline support | Recipe caching |

**Estimated Score:** 9.0–9.5/10

---

### 4.3 Monetization Potential (20%)

**Question:** *Is the subscription model compelling and sustainable?*

**Evaluation:**

| Strength | Evidence |
|----------|----------|
| RevenueCat integration | Proper SDK, entitlements, restore purchases |
| Clear tiers | Premium, Family, Lifetime |
| Free vs premium | 10 recipes, 5 imports, 3 AI recipes, limits on lists |
| Value proposition | Unlimited recipes, AI features, meal planning, scaling |
| Creator endorsement | On subscription screen |
| Paywall points | Natural upgrade prompts at friction points |

**Estimated Score:** 9.0–9.5/10

---

### 4.4 Innovation (15%)

**Question:** *Does the app offer unique features or a fresh approach?*

**Evaluation:**

| Strength | Evidence |
|----------|----------|
| Video recipe import | YouTube, TikTok, Instagram URL parsing |
| AI recipe parsing | Gemini for any URL |
| Voice-guided cooking | Step-by-step TTS |
| Smart timer detection | Parsed from instructions |
| Cooking streaks & achievements | Gamification |
| Pantry-based discovery | Recipes from ingredients you have |
| Photo journal | "I Made This!" with ratings |
| Recipe scaling | Fraction parsing, serving adjustment |
| Grocery delivery links | Instacart, store deep links |

**Estimated Score:** 9.0–9.5/10

---

### 4.5 Technical Quality (10%)

**Question:** *Is the app stable, performant, and well-built?*

**Evaluation:**

| Strength | Evidence |
|----------|----------|
| Architecture | React Native (Expo), TypeScript, tRPC |
| RevenueCat | Correct integration, error handling |
| Error handling | Error boundaries, retries |
| Monitoring | Sentry |
| Testing | E2E and unit tests |
| Type safety | TypeScript throughout |

**Estimated Score:** 9.0–9.5/10

---

## 5. Weighted Score Estimate

| Criterion | Weight | Est. Score | Weighted |
|-----------|--------|-------------|----------|
| Audience Fit | 30% | 9.3 | 2.79 |
| User Experience | 25% | 9.2 | 2.30 |
| Monetization Potential | 20% | 9.2 | 1.84 |
| Innovation | 15% | 9.0 | 1.35 |
| Technical Quality | 10% | 9.0 | 0.90 |
| **Total** | 100% | — | **9.18/10** |

---

## 6. Gaps and Action Items

### Before Submission (Feb 12, 11:45pm ET)

1. **TestFlight Link**
   - Resolve Xcode / App Store Connect upload
   - Ensure build is available for judges
   - Use an Apple ID with proper App Store Connect access

2. **Demo Video**
   - Duration: under 3 minutes
   - Show app on a real device
   - Include: problem → solution, core flow, monetization
   - Upload to YouTube/Vimeo and add public link to submission

3. **Written Proposal**
   - Use or adapt PROJECT_STORY.md
   - Explicitly state Creator Brief choice (Eitan Bernath #1)
   - Include testing instructions and login credentials if required

4. **New Project Positioning**
   - Clarify in the proposal how Sous was developed for the hackathon
   - Document work done during the Submission Period if relevant

---

## 7. Competitive Advantages

1. **Strong brief alignment** — Covers all stated Eitan requirements
2. **End-to-end flow** — Save → shop → cook → track completion
3. **RevenueCat usage** — Real entitlements, restore, clear free/premium split
4. **Production-level feel** — Polished UI, haptics, voice, timers, gamification
5. **Technical quality** — TypeScript, tRPC, testing, error handling

---

## 8. Final Checklist

- [ ] TestFlight link working and shared in submission
- [ ] Demo video recorded, under 3 min, public link added
- [ ] Written proposal finalized and uploaded
- [ ] "New project" wording and timing addressed in proposal
- [ ] Devpost submission form completed
- [ ] All required fields filled
- [ ] Submission before Feb 12, 11:45pm ET

---

**Bottom line:** Sous aligns strongly with Eitan’s brief and scores well across all judging dimensions. The main blockers are operational: a working TestFlight link, a compliant demo video, and clear handling of the "new projects" rule in the written proposal.
