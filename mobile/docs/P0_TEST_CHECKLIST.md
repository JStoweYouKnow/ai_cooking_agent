# P0 Test Execution Checklist

**Tester:** ________________
**Date:** ________________
**App Version:** ________________
**Device:** ________________
**iOS Version:** ________________

---

## Pre-Test Setup
- [ ] Fresh app install (delete and reinstall)
- [ ] Logged out state
- [ ] WiFi connected
- [ ] Push notifications enabled in iOS Settings
- [ ] StoreKit sandbox account ready

---

## 1. TEXT INPUT (6 tests)

### 1.1 Emoji in Recipe Name
- [ ] **PASS** / **FAIL**
- Steps:
  1. Go to Recipes → Create Recipe
  2. Enter title: "🍕 Pizza Night 🎉"
  3. Add one ingredient
  4. Add instructions
  5. Tap Save
- Expected: Recipe saves, displays correctly in list with emojis
- Actual: ________________________________________________
- Screenshot: [ ]

### 1.2 Emoji in Ingredients
- [ ] **PASS** / **FAIL**
- Steps:
  1. Create Recipe
  2. Add ingredient: "🧅 Onion - 1 large"
  3. Save recipe
  4. View recipe detail
- Expected: Ingredient displays with emoji, parses correctly
- Actual: ________________________________________________

### 1.3 Very Long Recipe Name (500+ chars)
- [ ] **PASS** / **FAIL**
- Steps:
  1. Create Recipe
  2. Paste 500+ character title
  3. Tap Save
- Expected: Shows validation error OR truncates gracefully, no crash
- Actual: ________________________________________________

### 1.4 Empty Input Submission
- [ ] **PASS** / **FAIL**
- Steps:
  1. Create Recipe
  2. Leave all fields empty
  3. Tap Save
- Expected: Shows validation error for required fields
- Actual: ________________________________________________

### 1.5 Whitespace-Only Input
- [ ] **PASS** / **FAIL**
- Steps:
  1. Create Recipe
  2. Enter only spaces "     " in title
  3. Tap Save
- Expected: Shows validation error, treats as empty
- Actual: ________________________________________________

### 1.6 Paste Very Long Text
- [ ] **PASS** / **FAIL**
- Steps:
  1. Copy 10,000+ characters to clipboard
  2. Create Recipe → paste in Instructions
  3. Observe behavior
- Expected: Handles gracefully, no freeze/crash
- Actual: ________________________________________________

---

## 2. DEEP LINKS (6 tests)

### 2.1 Cold Start Deep Link
- [ ] **PASS** / **FAIL**
- Steps:
  1. Force quit app (swipe up in app switcher)
  2. Open Safari
  3. Enter: `sous://recipe/[VALID_RECIPE_ID]`
  4. Tap Go
- Expected: App launches directly to recipe detail
- Actual: ________________________________________________

### 2.2 Background Deep Link
- [ ] **PASS** / **FAIL**
- Steps:
  1. Open app, navigate to Home
  2. Background app (press home)
  3. Open deep link from Safari
- Expected: App comes to foreground, navigates to recipe
- Actual: ________________________________________________

### 2.3 Non-Existent Recipe ID
- [ ] **PASS** / **FAIL**
- Steps:
  1. Open: `sous://recipe/999999999`
- Expected: Shows "Recipe not found" error, no crash
- Actual: ________________________________________________

### 2.4 Malformed URL
- [ ] **PASS** / **FAIL**
- Steps:
  1. Open: `sous://recipe/abc`
- Expected: Graceful error handling, no crash
- Actual: ________________________________________________

### 2.5 SQL Injection Attempt
- [ ] **PASS** / **FAIL**
- Steps:
  1. Open: `sous://recipe/1;DROP TABLE recipes`
- Expected: Treated as literal string, no database impact
- Actual: ________________________________________________

### 2.6 Deep Link While Logged Out
- [ ] **PASS** / **FAIL**
- Steps:
  1. Log out of app
  2. Open deep link to recipe
- Expected: Shows login screen, then navigates after auth
- Actual: ________________________________________________

---

## 3. PUSH NOTIFICATIONS (4 tests)

### 3.1 First Permission Prompt
- [ ] **PASS** / **FAIL**
- Steps:
  1. Fresh install (delete app first)
  2. Complete onboarding
  3. Trigger notification permission request
- Expected: iOS system prompt appears
- Actual: ________________________________________________

### 3.2 Permission Denied Handling
- [ ] **PASS** / **FAIL**
- Steps:
  1. Deny notification permission
  2. Use notification-related feature
- Expected: App works, shows alternative (no crash)
- Actual: ________________________________________________

### 3.3 Tap Notification (App Killed)
- [ ] **PASS** / **FAIL**
- Steps:
  1. Force quit app
  2. Send test notification
  3. Tap notification in Notification Center
- Expected: App opens to relevant content
- Actual: ________________________________________________

### 3.4 Tap Notification (App Background)
- [ ] **PASS** / **FAIL**
- Steps:
  1. Background app
  2. Send test notification
  3. Tap notification
- Expected: Navigates to relevant screen
- Actual: ________________________________________________

---

## 4. IN-APP PURCHASES (8 tests)

### 4.1 Successful Purchase
- [ ] **PASS** / **FAIL**
- Steps:
  1. Go to Settings → Subscription
  2. Select a plan
  3. Complete purchase with sandbox account
- Expected: Subscription activates, premium features unlock
- Actual: ________________________________________________

### 4.2 Purchase Cancelled
- [ ] **PASS** / **FAIL**
- Steps:
  1. Start purchase flow
  2. Cancel at payment sheet
- Expected: Returns to subscription screen, no error
- Actual: ________________________________________________

### 4.3 Purchase with Slow Network
- [ ] **PASS** / **FAIL**
- Steps:
  1. Enable Network Link Conditioner → 3G
  2. Complete purchase
- Expected: Shows loading, eventually succeeds
- Actual: ________________________________________________

### 4.4 Restore Valid Subscription
- [ ] **PASS** / **FAIL**
- Steps:
  1. Have active subscription on account
  2. Fresh install
  3. Log in
  4. Tap "Restore Purchases"
- Expected: Subscription restored
- Actual: ________________________________________________

### 4.5 Restore with No Purchases
- [ ] **PASS** / **FAIL**
- Steps:
  1. Use account with no purchase history
  2. Tap "Restore Purchases"
- Expected: Shows "No purchases to restore" message
- Actual: ________________________________________________

### 4.6 Active Subscription Persists
- [ ] **PASS** / **FAIL**
- Steps:
  1. Purchase subscription
  2. Force quit app
  3. Reopen app
- Expected: Still shows premium status
- Actual: ________________________________________________

### 4.7 Network Error During Purchase
- [ ] **PASS** / **FAIL**
- Steps:
  1. Start purchase
  2. Enable Airplane Mode mid-flow
- Expected: Shows error, no double charge possible
- Actual: ________________________________________________

### 4.8 Receipt Validation
- [ ] **PASS** / **FAIL**
- Steps:
  1. Complete purchase
  2. Check server logs for receipt validation
- Expected: Server confirms valid receipt
- Actual: ________________________________________________

---

## 5. BACKGROUND TASKS (4 tests)

### 5.1 Background → Foreground Data Refresh
- [ ] **PASS** / **FAIL**
- Steps:
  1. Open app, view recipe list
  2. Background app for 5 minutes
  3. Add recipe via web (if possible)
  4. Return to app
- Expected: Data refreshes, shows new content
- Actual: ________________________________________________

### 5.2 Memory Pressure Recovery
- [ ] **PASS** / **FAIL**
- Steps:
  1. Open Sous app
  2. Open 10+ other apps
  3. Return to Sous
- Expected: Restores state or gracefully reloads
- Actual: ________________________________________________

### 5.3 Unsaved Form Data Preserved
- [ ] **PASS** / **FAIL**
- Steps:
  1. Start creating recipe (fill partial data)
  2. Background app
  3. Wait 1 minute
  4. Return to app
- Expected: Form data still present
- Actual: ________________________________________________

### 5.4 App Termination Recovery
- [ ] **PASS** / **FAIL**
- Steps:
  1. Use app normally
  2. Wait for iOS to terminate (or force quit)
  3. Reopen app
- Expected: Starts fresh without crash
- Actual: ________________________________________________

---

## 6. ADDITIONAL CRITICAL (2 tests)

### 6.1 VoiceOver Navigation
- [ ] **PASS** / **FAIL**
- Steps:
  1. Enable VoiceOver (Settings → Accessibility)
  2. Navigate through main screens
- Expected: All elements announced, navigation works
- Actual: ________________________________________________

### 6.2 Dynamic Type (Largest)
- [ ] **PASS** / **FAIL**
- Steps:
  1. Set text size to maximum (Settings → Accessibility → Display)
  2. Check all main screens
- Expected: Text readable, no overlap/cutoff
- Actual: ________________________________________________

---

## Summary

| Category | Passed | Failed | Total |
|----------|--------|--------|-------|
| Text Input | ___ | ___ | 6 |
| Deep Links | ___ | ___ | 6 |
| Push Notifications | ___ | ___ | 4 |
| In-App Purchases | ___ | ___ | 8 |
| Background Tasks | ___ | ___ | 4 |
| Additional | ___ | ___ | 2 |
| **TOTAL** | ___ | ___ | **30** |

## Failed Tests (Details)

| Test ID | Issue Description | Severity | Bug Ticket |
|---------|-------------------|----------|------------|
| | | | |
| | | | |
| | | | |

## Notes

________________________________________________
________________________________________________
________________________________________________

**Sign-off:** ________________ Date: ________________
