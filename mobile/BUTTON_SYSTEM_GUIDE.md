# Unified Button System Guide

## Overview

A modern, consistent button system for the entire mobile app that maintains the current color scheme while providing semantic variants, multiple sizes, and proper state handling.

## Design Principles

- **Modern flat/soft design** - No skeuomorphic gradients, clean appearance
- **Rounded corners** - Consistent `borderRadius.md` (12px)
- **Subtle elevation** - Shadows only on primary and destructive buttons
- **Clear focus states** - Proper accessibility with scale/opacity feedback
- **Mobile-first** - Comfortable hit areas (min 44px height), no fixed widths
- **Smooth animations** - Subtle press feedback with spring animations

## Color Scheme (Maintained)

- **Primary**: Olive (`#77856A`) - Main actions
- **Secondary**: Russet (`#854D3D`) - Secondary actions
- **Tertiary**: Outline style with olive border - Subtle actions
- **Destructive**: Error red (`#F44336`) - Destructive actions

## Button Variants

### Primary
Main call-to-action buttons. Use for primary actions like "Save", "Subscribe", "Continue".

```tsx
<Button title="Save" onPress={handleSave} variant="primary" />
```

### Secondary
Secondary actions. Use for alternative actions like "Cancel", "Back".

```tsx
<Button title="Cancel" onPress={handleCancel} variant="secondary" />
```

### Tertiary
Subtle actions. Use for less important actions, links that look like buttons.

```tsx
<Button title="Learn More" onPress={handleLearnMore} variant="tertiary" />
```

### Destructive
Destructive actions. Use for delete, remove, or destructive operations.

```tsx
<Button title="Delete Account" onPress={handleDelete} variant="destructive" />
```

## Sizes

- **sm**: Small buttons (36px min height) - For compact spaces
- **md**: Medium buttons (48px min height) - Default, most common
- **lg**: Large buttons (56px min height) - For prominent CTAs

```tsx
<Button title="Small" size="sm" />
<Button title="Medium" size="md" /> {/* Default */}
<Button title="Large" size="lg" />
```

## States

All buttons automatically handle:
- **Default**: Normal state
- **Press**: Scale down (0.97x) with opacity change
- **Disabled**: 50% opacity, non-interactive
- **Loading**: Shows spinner, disables interaction

## Usage Examples

### Basic Usage

```tsx
import { Button } from "../components/buttons";

// Primary button (default)
<Button title="Subscribe" onPress={handleSubscribe} />

// Secondary button
<Button title="Cancel" onPress={handleCancel} variant="secondary" />

// Destructive button
<Button title="Delete" onPress={handleDelete} variant="destructive" />

// With loading state
<Button 
  title="Save" 
  onPress={handleSave} 
  loading={isSaving} 
/>

// With icon
<Button 
  title="Share" 
  onPress={handleShare}
  icon={<Ionicons name="share-outline" size={20} color={colors.text.inverse} />}
/>

// Full width
<Button 
  title="Continue" 
  onPress={handleContinue}
  fullWidth
/>
```

## Migration Guide

### Before & After Examples

#### Example 1: Subscription Screen

**Before:**
```tsx
<GradientButton
  title="Subscribe"
  onPress={() => handlePurchase(product)}
  disabled={isProcessing}
  style={{ marginTop: spacing.md }}
/>
```

**After:**
```tsx
<Button
  title="Subscribe"
  onPress={() => handlePurchase(product)}
  variant="primary"
  size="lg"
  disabled={isProcessing}
  loading={isProcessing}
  style={{ marginTop: spacing.md }}
/>
```

#### Example 2: Settings Screen - Sign Out

**Before:**
```tsx
<GradientButton 
  title="Sign Out" 
  variant="secondary" 
  onPress={logout} 
  style={{ marginTop: spacing.md }} 
/>
```

**After:**
```tsx
<Button
  title="Sign Out"
  onPress={logout}
  variant="secondary"
  style={{ marginTop: spacing.md }}
/>
```

#### Example 3: Settings Screen - Disable Button

**Before:**
```tsx
<GradientButton
  title={unregisterDevice.isPending ? "Disabling..." : "Disable"}
  variant="secondary"
  onPress={() => primaryPushToken && handleDisablePush(primaryPushToken)}
  disabled={unregisterDevice.isPending}
  style={[styles.halfButton, { flex: 1 }]}
/>
```

**After:**
```tsx
<Button
  title="Disable"
  onPress={() => primaryPushToken && handleDisablePush(primaryPushToken)}
  variant="tertiary"
  disabled={unregisterDevice.isPending}
  loading={unregisterDevice.isPending}
  style={[styles.halfButton, { flex: 1 }]}
/>
```

#### Example 4: Custom TouchableOpacity

**Before:**
```tsx
<TouchableOpacity
  style={{
    backgroundColor: colors.olive,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
  }}
  onPress={handleAction}
>
  <Text style={{ color: "#fff", fontWeight: "600" }}>Action</Text>
</TouchableOpacity>
```

**After:**
```tsx
<Button
  title="Action"
  onPress={handleAction}
  variant="primary"
/>
```

#### Example 5: Delete Action

**Before:**
```tsx
<TouchableOpacity
  style={{
    backgroundColor: colors.error,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  }}
  onPress={handleDelete}
>
  <Text style={{ color: "#fff" }}>Delete</Text>
</TouchableOpacity>
```

**After:**
```tsx
<Button
  title="Delete"
  onPress={handleDelete}
  variant="destructive"
/>
```

## Component API

### Button Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | **required** | Button label text |
| `onPress` | `() => void` | **required** | Press handler |
| `variant` | `"primary" \| "secondary" \| "tertiary" \| "destructive"` | `"primary"` | Semantic variant |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | Size variant |
| `loading` | `boolean` | `false` | Show loading spinner |
| `disabled` | `boolean` | `false` | Disable button |
| `icon` | `React.ReactNode` | `undefined` | Left icon/element |
| `iconRight` | `React.ReactNode` | `undefined` | Right icon/element |
| `fullWidth` | `boolean` | `false` | Full width button |
| `style` | `ViewStyle` | `undefined` | Custom container styles |
| `textStyle` | `TextStyle` | `undefined` | Custom text styles |
| `accessibilityLabel` | `string` | `undefined` | Accessibility label |
| `accessibilityHint` | `string` | `undefined` | Accessibility hint |

## Accessibility

- Minimum touch target: 44px height (meets WCAG guidelines)
- Proper accessibility roles and labels
- Clear visual feedback for all states
- Disabled state properly communicated

## Migration Checklist

- [ ] Replace all `GradientButton` instances with `Button`
- [ ] Replace ad-hoc `TouchableOpacity` buttons with `Button`
- [ ] Update variant mappings:
  - `GradientButton variant="primary"` → `Button variant="primary"`
  - `GradientButton variant="secondary"` → `Button variant="secondary"`
  - `GradientButton variant="olive"` → `Button variant="primary"`
- [ ] Add `loading` prop where appropriate (instead of changing title)
- [ ] Use `variant="destructive"` for delete/remove actions
- [ ] Use `variant="tertiary"` for outline-style buttons
- [ ] Remove custom button styles in favor of Button component

## Notes

- The old `Button.tsx`, `GradientButton.tsx` components can be deprecated after migration
- `PressableButton.tsx` can remain for special cases that need debouncing
- `IconButton.tsx` remains separate for icon-only buttons
- All buttons maintain the existing color scheme (olive, russet, navy, etc.)
