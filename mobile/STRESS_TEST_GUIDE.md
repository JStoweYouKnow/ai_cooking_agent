# Sous iOS App – Stress Test Guide

## Option 1: Maestro (automated)

Maestro runs UI flows against the installed app (simulator or device) without code changes.

### Install Maestro

```bash
curl -Ls "https://get.maestro.mobile.dev" | bash
```

Or via Homebrew:

```bash
brew tap mobile-dev-inc/tap
brew install maestro
```

### Run stress tests

1. Build and install the app on the iOS simulator:
   ```bash
   cd mobile
   pnpm exec expo run:ios
   ```

2. Run the navigation stress test:
   ```bash
   maestro test .maestro/stress-test.yaml
   ```

3. Run the monkey-style stress test (random taps):
   ```bash
   maestro test .maestro/stress-monkey.yaml
   ```

Note: If flows fail on `tapOn`, the tab bar may not use `testID`s. You can adapt selectors in the YAML files to match your UI (e.g. text or accessibility labels).

---

## Option 2: Manual stress checklist

Run through this on a device or simulator.

### Navigation stress

- [ ] Rapid tab switching: Dashboard → Recipes → Shopping → Ingredients → More, repeat 20+ times
- [ ] Back/forward: Open a recipe → back → another recipe → back, repeat 15 times
- [ ] Open Cooking Mode → exit → reopen, repeat 10 times
- [ ] Open Shopping List detail → back → different list → back, repeat 15 times

### Memory / long session

- [ ] Keep app in foreground for 30+ minutes with normal use
- [ ] Open 10+ recipes in sequence without closing
- [ ] Add 50+ items to a shopping list
- [ ] Search recipes 20+ times with different queries

### Interrupt / background

- [ ] Start Cooking Mode → background app (Home) → return after 5 min
- [ ] Start timer in Cooking Mode → background → return when timer ends
- [ ] Import recipe URL → switch away during parsing → return
- [ ] Open app → receive call/notification → return

### Edge / error paths

- [ ] Paste invalid URL in Import → submit → retry with valid URL
- [ ] Toggle airplane mode on/off while app is loading
- [ ] Rotate device several times during navigation
- [ ] Low Power Mode on → run for 10 min

### Subscription / paywall

- [ ] Open Subscription screen 10 times
- [ ] Hit free-tier limits (e.g. 10 recipes) → trigger paywall → dismiss
- [ ] Restore Purchases multiple times

---

## Option 3: Xcode Instruments (memory & performance)

1. Open the project in Xcode:
   ```bash
   cd mobile
   open ios/ai_cooking_agent.xcworkspace
   ```
   (If using Expo prebuild: `npx expo prebuild` first, then open the generated `ios` folder.)

2. Product → Profile (⌘I)

3. Choose:
   - **Allocations** – memory growth, leaks
   - **Leaks** – leak detection
   - **Time Profiler** – CPU hotspots

4. Run the app through Instruments while you perform the manual stress flows above.

---

## Option 4: Simulator stress (built-in)

1. Boot the iOS Simulator.
2. Run the app:
   ```bash
   cd mobile && pnpm exec expo run:ios
   ```
3. In Simulator: **Device → Erase All Content and Settings** (optional, for clean state).
4. In Simulator: **Debug → Simulate Memory Warning** repeatedly during use.
5. In Simulator: **Debug → Toggle Slow Animations** to make transitions easier to inspect.

---

## Interpreting results

- Crashes or freezes → capture logs via Xcode or `xcrun simctl spawn booted log stream`.
- Memory growth → check Instruments Allocations; look for unbounded growth.
- Slow UI → Time Profiler for heavy JavaScript or layout work.
- Navigation issues → Maestro or manual navigation stress; verify state is restored correctly.
