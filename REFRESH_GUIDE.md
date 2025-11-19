# Browser Refresh Guide

Your changes are in place! The issue you're seeing is likely due to browser caching.

## How to Hard Refresh

### Chrome/Edge (Mac)
Press: `Cmd + Shift + R`

### Chrome/Edge (Windows/Linux)
Press: `Ctrl + Shift + R`

### Safari
1. Press `Cmd + Option + E` (empty caches)
2. Then `Cmd + R` (refresh)

### Firefox
Press: `Ctrl + Shift + R` (or `Cmd + Shift + R` on Mac)

## What You Should See After Refresh

### On Desktop (screen width >= 1024px):
- ✅ Horizontal navigation (Home, Recipes, Ingredients, Lists) in center of header
- ✅ ONE "Sign in" button in top-right (if not logged in)
- ✅ ONE theme toggle in top-right
- ❌ NO bottom navigation bar
- ❌ NO hamburger menu button

### On Mobile/Tablet (screen width < 1024px):
- ✅ Logo on left
- ✅ Search icon button
- ✅ Hamburger menu button (three lines)
- ✅ ONE "Sign in" button OR user avatar (if not logged in)
- ✅ Bottom navigation bar with 4 icons (Home, Recipes, Ingredients, Lists)
- ❌ NO theme toggle in header (it's inside the settings drawer)
- ❌ NO horizontal navigation in header

### Settings Drawer (Mobile only - click hamburger or avatar):
- ✅ User profile section
- ✅ Settings link
- ✅ Notifications link
- ✅ Theme toggle row
- ✅ Sign out button (if logged in)

## If You Still See Issues

1. Open browser DevTools (F12)
2. Go to Network tab
3. Check "Disable cache" checkbox
4. Hard refresh again
5. Check Console tab for any errors

## Dev Server
Your dev server is running at: http://localhost:3000
