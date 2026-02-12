# iOS Edge Case Test Scenarios

Prioritized by **Impact** (Critical/High/Medium) and **Likelihood** (Common/Occasional/Rare)

---

## 1. TEXT INPUT (Impact: Critical, Likelihood: Common)

### 1.1 Emoji & Special Characters
| Test | Steps | Expected | Priority |
|------|-------|----------|----------|
| Emoji in recipe name | 1. Create Recipe → 2. Enter "🍕 Pizza Night 🎉" → 3. Save | Saves correctly, displays in list | P0 |
| Emoji in ingredients | 1. Add ingredient "🧅 Onion" | Parses correctly, no crash | P0 |
| RTL text (Arabic/Hebrew) | 1. Enter "وصفة" in search | Text displays correctly, no layout break | P1 |
| Mixed emoji + text paste | 1. Copy "Chicken 🍗 with Rice 🍚" → 2. Paste in recipe title | Full text pastes, no truncation | P0 |

### 1.2 Extreme Input Lengths
| Test | Steps | Expected | Priority |
|------|-------|----------|----------|
| Very long recipe name | 1. Enter 500+ character recipe name → 2. Save | Truncates or shows error, no crash | P0 |
| Empty input submission | 1. Leave all fields empty → 2. Tap Save | Shows validation error | P0 |
| Single character | 1. Enter "A" as recipe name → 2. Save | Either accepts or shows min length error | P1 |
| Whitespace only | 1. Enter "   " (spaces only) → 2. Save | Shows validation error, trims whitespace | P0 |

### 1.3 Keyboard Interactions
| Test | Steps | Expected | Priority |
|------|-------|----------|----------|
| Keyboard dismiss on scroll | 1. Focus text input → 2. Scroll content | Keyboard dismisses | P1 |
| Input behind keyboard | 1. Tap bottom text field | View scrolls up, input visible | P0 |
| Hardware keyboard | 1. Connect Bluetooth keyboard → 2. Type in fields | All inputs work correctly | P2 |
| Dictation input | 1. Tap microphone → 2. Dictate recipe | Text appears correctly | P1 |
| Paste very long text | 1. Copy 10,000+ chars → 2. Paste in notes | Handles gracefully, no freeze | P1 |

### 1.4 Autocorrect & Predictive Text
| Test | Steps | Expected | Priority |
|------|-------|----------|----------|
| Autocorrect ingredient | 1. Type "chiken" → 2. Accept autocorrect | "Chicken" saved correctly | P1 |
| Disable autocorrect fields | 1. Type in email field | No autocorrect on email/password | P1 |
| Predictive text selection | 1. Type partial word → 2. Tap suggestion | Word inserts correctly | P2 |

---

## 2. DEEP LINKS (Impact: High, Likelihood: Occasional)

### 2.1 App State Scenarios
| Test | Steps | Expected | Priority |
|------|-------|----------|----------|
| Cold start deep link | 1. Force quit app → 2. Open `sous://recipe/123` | App opens directly to recipe | P0 |
| Background deep link | 1. Background app → 2. Open `sous://recipe/123` | Navigates to recipe | P0 |
| Foreground deep link | 1. App in foreground → 2. Open link from Safari | Navigates without disrupting state | P1 |

### 2.2 Invalid Deep Links
| Test | Steps | Expected | Priority |
|------|-------|----------|----------|
| Non-existent recipe ID | 1. Open `sous://recipe/999999` | Shows "Recipe not found" error | P0 |
| Malformed URL | 1. Open `sous://recipe/abc` | Graceful error, no crash | P0 |
| Missing path | 1. Open `sous://` | Opens app to home/default screen | P1 |
| SQL injection attempt | 1. Open `sous://recipe/1;DROP TABLE` | Sanitized, no crash | P0 |

### 2.3 Auth-Required Deep Links
| Test | Steps | Expected | Priority |
|------|-------|----------|----------|
| Deep link while logged out | 1. Log out → 2. Open `sous://recipe/123` | Shows login, then navigates after auth | P0 |
| Deep link with expired token | 1. Let token expire → 2. Open deep link | Prompts re-auth, then navigates | P1 |

### 2.4 Universal Links
| Test | Steps | Expected | Priority |
|------|-------|----------|----------|
| HTTPS universal link | 1. Tap `https://sous.app/recipe/123` in Safari | Opens in app, not browser | P0 |
| Universal link app not installed | 1. Uninstall → 2. Tap link | Opens in Safari/App Store | P1 |
| Copy/paste universal link | 1. Paste link in Notes → 2. Tap | Opens correctly | P2 |

---

## 3. PUSH NOTIFICATIONS (Impact: High, Likelihood: Common)

### 3.1 Permission States
| Test | Steps | Expected | Priority |
|------|-------|----------|----------|
| First permission prompt | 1. Fresh install → 2. Trigger notification request | System prompt appears | P0 |
| Permission denied | 1. Deny notifications → 2. Trigger notification feature | Graceful degradation, no crash | P0 |
| Permission change in Settings | 1. Enable in iOS Settings → 2. Return to app | App detects new permission state | P1 |

### 3.2 Notification Handling
| Test | Steps | Expected | Priority |
|------|-------|----------|----------|
| Tap notification (app killed) | 1. Force quit → 2. Receive notification → 3. Tap | Opens to relevant screen | P0 |
| Tap notification (app background) | 1. Background app → 2. Tap notification | Navigates correctly | P0 |
| Tap notification (app foreground) | 1. App open → 2. Receive notification | Banner shows, tap navigates | P1 |
| Multiple notifications | 1. Receive 5 notifications → 2. Tap oldest | Opens correct content | P1 |

### 3.3 Edge Cases
| Test | Steps | Expected | Priority |
|------|-------|----------|----------|
| Notification with deleted content | 1. Receive notification for recipe → 2. Delete recipe → 3. Tap notification | Shows "Content unavailable" | P1 |
| Notification during call | 1. Start phone call → 2. Receive notification | Doesn't interrupt call | P2 |
| Notification in DND mode | 1. Enable DND → 2. Send notification | Respects DND settings | P2 |
| Badge count accuracy | 1. Receive 3 notifications → 2. Open app → 3. Check badge | Badge clears appropriately | P1 |

### 3.4 Payload Handling
| Test | Steps | Expected | Priority |
|------|-------|----------|----------|
| Large payload | 1. Send notification with max payload | Displays correctly | P1 |
| Missing required fields | 1. Send notification missing title | Handles gracefully | P1 |
| Special characters in payload | 1. Send notification with "Recipe: 🍕 <script>" | Displays safely, no XSS | P0 |

---

## 4. IN-APP PURCHASES (Impact: Critical, Likelihood: Occasional)

### 4.1 Purchase Flow
| Test | Steps | Expected | Priority |
|------|-------|----------|----------|
| Successful purchase | 1. Subscription screen → 2. Select plan → 3. Authenticate → 4. Complete | Subscription activated | P0 |
| Purchase cancelled | 1. Start purchase → 2. Cancel at payment sheet | Returns to subscription screen | P0 |
| Purchase with slow network | 1. Throttle to 3G → 2. Complete purchase | Shows loading, eventually succeeds | P0 |

### 4.2 Restore Purchases
| Test | Steps | Expected | Priority |
|------|-------|----------|----------|
| Restore valid subscription | 1. Tap Restore Purchases → 2. Authenticate | Subscription restored | P0 |
| Restore with no purchases | 1. Fresh account → 2. Tap Restore | Shows "No purchases to restore" | P0 |
| Restore expired subscription | 1. Let subscription expire → 2. Restore | Shows expired status | P1 |

### 4.3 Subscription States
| Test | Steps | Expected | Priority |
|------|-------|----------|----------|
| Active subscription check | 1. Purchase → 2. Kill app → 3. Reopen | Still shows premium | P0 |
| Expired subscription | 1. Use sandbox to expire → 2. Check status | Premium features locked | P0 |
| Grace period | 1. Payment fails → 2. Check during grace period | Features still available | P1 |
| Subscription upgrade | 1. Have monthly → 2. Purchase yearly | Upgrades correctly, prorated | P1 |

### 4.4 Error Scenarios
| Test | Steps | Expected | Priority |
|------|-------|----------|----------|
| Network error during purchase | 1. Start purchase → 2. Disable network mid-flow | Shows error, no double charge | P0 |
| StoreKit timeout | 1. Simulate StoreKit timeout | Shows timeout error, retry option | P0 |
| Invalid product ID | 1. Request non-existent product | Graceful error handling | P1 |
| Purchase interrupted (phone call) | 1. Start purchase → 2. Receive call → 3. Return | Can resume or restart | P1 |

### 4.5 Receipt Validation
| Test | Steps | Expected | Priority |
|------|-------|----------|----------|
| Valid receipt | 1. Complete purchase → 2. Check server validation | Server confirms valid | P0 |
| Tampered receipt | 1. Modify receipt data → 2. Send to server | Server rejects | P0 |
| Receipt validation offline | 1. Purchase → 2. Go offline → 3. Check status | Uses cached validation | P1 |

---

## 5. BACKGROUND TASKS (Impact: Medium, Likelihood: Common)

### 5.1 App Lifecycle
| Test | Steps | Expected | Priority |
|------|-------|----------|----------|
| Background → Foreground | 1. Background app for 5 min → 2. Return | Data refreshes, no stale state | P0 |
| Memory pressure | 1. Open many apps → 2. Return to Sous | Restores state correctly | P0 |
| App termination | 1. Let iOS terminate app → 2. Reopen | Starts fresh, no crash | P0 |

### 5.2 Network Tasks
| Test | Steps | Expected | Priority |
|------|-------|----------|----------|
| Background fetch | 1. Enable background refresh → 2. Wait for fetch | Data syncs in background | P1 |
| Upload interrupted | 1. Start recipe upload → 2. Background app | Upload completes or queues | P1 |
| Download while backgrounded | 1. Start large download → 2. Background | Download continues | P1 |

### 5.3 State Preservation
| Test | Steps | Expected | Priority |
|------|-------|----------|----------|
| Unsaved form data | 1. Fill recipe form → 2. Background → 3. Return | Form data preserved | P0 |
| Scroll position | 1. Scroll recipe list → 2. Background → 3. Return | Position preserved | P1 |
| Modal state | 1. Open bottom sheet → 2. Background → 3. Return | Modal still visible | P2 |

### 5.4 Timer/Schedule Tasks
| Test | Steps | Expected | Priority |
|------|-------|----------|----------|
| Cooking timer backgrounded | 1. Start timer → 2. Background app | Timer continues, notification fires | P0 |
| Scheduled notification | 1. Schedule reminder → 2. Close app | Notification fires at scheduled time | P1 |
| Timer across device restart | 1. Start timer → 2. Restart device | Timer state recovered or notifies | P2 |

---

## 6. ADDITIONAL CRITICAL SCENARIOS

### 6.1 Low Storage
| Test | Steps | Expected | Priority |
|------|-------|----------|----------|
| Save with full storage | 1. Fill device storage → 2. Save recipe | Shows storage error | P0 |
| Cache when storage low | 1. Low storage → 2. Use app | Cache evicts old data | P1 |

### 6.2 Accessibility
| Test | Steps | Expected | Priority |
|------|-------|----------|----------|
| VoiceOver navigation | 1. Enable VoiceOver → 2. Navigate all screens | All elements announced | P0 |
| Dynamic Type (largest) | 1. Set largest text size → 2. Check all screens | Text readable, no overlap | P0 |
| Reduce Motion | 1. Enable Reduce Motion → 2. Check animations | Animations reduced/removed | P1 |

### 6.3 Date/Time Edge Cases
| Test | Steps | Expected | Priority |
|------|-------|----------|----------|
| Timezone change | 1. Change timezone → 2. Check timestamps | Times display correctly | P1 |
| 24hr vs 12hr format | 1. Toggle time format → 2. Check times | Respects system setting | P2 |
| DST transition | 1. Schedule during DST change | Handles correctly | P2 |

---

## Test Execution Priority

**P0 (Must test before release):** 28 scenarios
**P1 (Should test before release):** 31 scenarios
**P2 (Test if time permits):** 12 scenarios

### Quick Smoke Test (15 min)
1. Fresh install → Login
2. Create recipe with emoji
3. Complete subscription purchase
4. Tap push notification
5. Deep link while logged out
6. Background/foreground cycle

### Full Regression (2-3 hours)
Run all P0 and P1 scenarios with both WiFi and cellular connections.
