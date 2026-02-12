# Sous: Turning Recipe Inspiration into Real Meals

**Built for the RevenueCat Shipyard: Creator Contest (Eitan Bernath Brief #1)**  
**Submission Period:** January 15 – February 12, 2026

---

## Hackathon Development

Sous was **built specifically for this hackathon** in response to Eitan Bernath's brief. During the Submission Period, we developed the features that directly address Eitan's requirements:

- **"I Cooked It" tracking** — Mark recipes as cooked, track completion, celebrate the moment (Eitan's core ask)
- **Video recipe import** — Paste YouTube, TikTok, or Instagram URLs; we extract the recipe and generate a shopping list (Eitan's exact quote)
- **RevenueCat integration** — Full subscription model with Premium/Family/Lifetime, entitlements, restore purchases
- **Recipe photos & Photo Journal** — "I Made This!" to document what you actually cooked
- **Gemini AI** — Recipe parsing from any URL or video, pantry-aware chat
- **Demo mode & judge access** — Hackathon judges can test all features

See [HACKATHON_DEVELOPMENT_TIMELINE.md](./HACKATHON_DEVELOPMENT_TIMELINE.md) for commit evidence and a detailed timeline.

---

## The Problem That Inspired Us

As home cooks ourselves, we've all been there: scrolling through TikTok, Instagram, or food blogs, saving recipe after recipe with the best intentions. "This looks amazing!" we think. "I'll make this next week!" But then... life happens. The recipes pile up in our saved folders, forgotten and uncooked.

When we saw **Eitan Bernath's brief** for the RevenueCat Shipyard Hackathon, it hit home. Eitan perfectly captured the frustration of modern home cooks: we're drowning in recipe inspiration but struggling to turn that inspiration into actual meals. The gap between "I want to make this" and "I cooked it" feels impossibly wide.

We realized the problem isn't lack of inspiration—it's the friction between finding a recipe and actually cooking it. The steps are too many, too disconnected:
1. Find a recipe (easy)
2. Save it somewhere (easy)
3. Plan when to cook it (hard)
4. Figure out what ingredients you need (hard)
5. Generate a shopping list (hard)
6. Actually cook it (hardest)

## What We Learned

Through user research and our own experiences, we discovered three key insights:

### 1. **The Shopping List Barrier**
The biggest friction point isn't finding recipes—it's the mental overhead of converting a recipe into a shopping list. Most people abandon recipes because they can't easily figure out what to buy.

### 2. **Context Switching Kills Momentum**
Jumping between apps (recipe → notes → shopping list → store) breaks the flow. By the time you've copied ingredients into your shopping app, you've lost the motivation to cook.

### 3. **Organization Without Action is Useless**
Beautiful recipe collections mean nothing if they don't lead to cooking. We needed to focus on **actionability**, not just organization.

## How We Built Sous

Sous is designed to eliminate every friction point between recipe inspiration and actual cooking. Here's how we built it:

### Core Architecture

**Tech Stack:**
- **Frontend:** React Native (Expo) for iOS and Android
- **Backend:** Next.js with tRPC for type-safe APIs
- **Database:** PostgreSQL with Drizzle ORM
- **AI:** Google Gemini 2.5 Flash for recipe parsing and ingredient recognition
- **Monetization:** RevenueCat SDK for iOS, Stripe for web/Android
- **Infrastructure:** Vercel for hosting, AWS S3 for image storage

### Key Features That Solve Eitan's Problem

#### 1. **One-Tap Recipe Import** 🎯
**Problem:** Copying recipes manually is tedious  
**Solution:** Paste any recipe URL and Sous automatically:
- Parses ingredients, instructions, and metadata
- Extracts images and cooking times
- Saves everything in one organized place

**Technical Challenge:** Recipe sites have wildly different HTML structures. We built a robust parser using AI to extract structured data from any format, handling edge cases like embedded videos, complex ingredient lists, and multi-step instructions.

#### 2. **Smart Shopping List Generation** 🛒
**Problem:** Converting recipes to shopping lists is manual and error-prone  
**Solution:** With one tap, Sous:
- Extracts all ingredients from saved recipes
- Groups by category (produce, dairy, meat, etc.)
- Generates a shareable shopping list
- Tracks what you already have in your pantry

**Technical Challenge:** Ingredient parsing is surprisingly complex. "2 cups of flour" vs "flour" vs "all-purpose flour" need to be normalized. We built an AI-powered ingredient recognition system that understands variations and quantities.

#### 3. **Recipe Discovery from Your Pantry** 🔍
**Problem:** You have ingredients but don't know what to cook  
**Solution:** Sous lets you:
- Add ingredients you have
- Search recipes across multiple sources (TheMealDB, Epicurious, Delish, NYTCooking)
- Find recipes you can make right now

**Technical Challenge:** Aggregating recipes from multiple APIs with different schemas required careful normalization and caching strategies.

#### 4. **AI-Powered Cooking Assistant** 🤖
**Problem:** Recipes don't adapt to your needs  
**Solution:** Sous uses AI to:
- Scale recipes up or down
- Suggest substitutions
- Answer cooking questions
- Provide personalized meal planning

### Monetization Strategy

We integrated **RevenueCat** to offer a sustainable freemium model:

**Free Tier:**
- Save up to 10 recipes
- Basic shopping lists
- Limited recipe imports

**Premium Tier ($4.99/month or $49.99/year):**
- Unlimited recipe saves
- Import from any recipe website
- Advanced shopping list features
- AI-powered meal planning
- Recipe scaling and substitutions
- Ad-free experience

This model ensures Sous can serve Eitan's audience while building a sustainable business.

## Challenges We Faced

### 1. **Recipe Parsing at Scale**
**Challenge:** Every recipe website has different HTML structure. Parsing reliably across thousands of sites seemed impossible.

**Solution:** We built a hybrid approach:
- Pattern matching for common sites (TheMealDB, Epicurious)
- AI-powered extraction for unknown sites
- Fallback to manual parsing with user-friendly error messages

**Learning:** Sometimes the best solution is graceful degradation, not perfection.

### 2. **Cross-Platform Monetization**
**Challenge:** iOS requires RevenueCat, Android/web can use Stripe. Managing two payment systems seemed complex.

**Solution:** We built a unified subscription service layer that abstracts payment providers. The app checks platform and routes to the appropriate SDK, while our backend maintains a single source of truth for subscription status.

**Learning:** Good architecture means the complexity is hidden from users and most of the codebase.

### 3. **Real-Time Ingredient Recognition**
**Challenge:** Users want to take photos of ingredients and have them recognized instantly.

**Solution:** We integrated Google Gemini Vision API for image-to-ingredient recognition. The challenge was balancing speed (local processing) vs accuracy (cloud API). We chose accuracy and optimized API calls with smart caching.

**Learning:** User experience sometimes means choosing the slower but more accurate path.

### 4. **State Management Across Platforms**
**Challenge:** Keeping subscription status, recipe data, and user preferences in sync across iOS, Android, and web.

**Solution:** We built a centralized backend with tRPC for type-safe APIs, React Query for client-side caching, and careful invalidation strategies.

**Learning:** Type safety isn't just about preventing bugs—it's about moving faster with confidence.

## How Sous Serves Eitan's Audience

### The "I Want to Make This" → "I Cooked It" Journey

**Before Sous:**
1. See recipe on TikTok → Save to camera roll
2. Later: Try to remember where you saved it
3. Find recipe → Manually write ingredients
4. Go to store → Forget half the ingredients
5. Get home → Realize you're missing something
6. Give up → Order takeout

**With Sous:**
1. See recipe on TikTok → Copy link → Paste in Sous
2. Sous auto-generates shopping list
3. Add to shopping list → Check off at store
4. Get home → Everything you need is ready
5. Follow recipe → Actually cook it! 🎉

### Specific Features That Address Eitan's Brief

✅ **Generate grocery lists from recipe videos or links**
- Paste any recipe URL, get an instant shopping list
- Works with TikTok, Instagram, YouTube, blogs, recipe sites

✅ **Organize cooking inspiration**
- Save recipes from multiple sources in one place
- Organize by meal type, cuisine, or custom collections
- Never lose a recipe again

✅ **Simplify the path from idea to execution**
- One-tap shopping list generation
- Pantry integration (know what you have)
- Recipe discovery based on available ingredients
- Cooking mode with step-by-step guidance

## Technical Highlights

### RevenueCat Integration
- Proper iOS SDK integration with user identification
- Entitlement-based access control
- Restore purchases functionality (App Store requirement)
- Cross-platform subscription sync

### AI-Powered Features
- Recipe parsing from any URL format
- Ingredient recognition from images
- Smart ingredient normalization
- Recipe scaling and substitution suggestions

### Performance Optimizations
- Image caching and optimization
- Smart API request batching
- Offline recipe access
- Optimistic UI updates

## What's Next

Sous is just getting started. Future features we're excited about:
- **Meal Planning:** Weekly meal plans with automatic shopping lists
- **Recipe Scaling:** AI-powered portion adjustments
- **Social Features:** Share recipes and cooking achievements
- **Nutrition Tracking:** Automatic nutrition calculation
- **Cooking Timers:** Built-in timers synced with recipe steps

## Conclusion

Eitan's brief resonated because it's a problem we've all experienced. Sous isn't just another recipe app—it's a **cooking execution system** designed to eliminate every barrier between inspiration and action.

We built Sous because we believe home cooks shouldn't have to choose between inspiration and execution. With Sous, every saved recipe becomes a real possibility, and every shopping trip becomes a step toward actually cooking.

**For Eitan's audience—home cooks overwhelmed by saved recipes—Sous is the bridge from "I want to make this" to "I cooked it."**

---

## Try Sous

- **iOS:** [TestFlight Link]
- **Demo Video:** [YouTube Link]
- **GitHub:** [Repository Link]

Built with ❤️ for home cooks who want to turn inspiration into action.
