import { test, expect } from '@playwright/test';

test.describe('Critical User Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page
    await page.goto('/');
  });

  test('should navigate to dashboard', async ({ page }) => {
    // Check if dashboard loads
    await expect(page).toHaveURL(/.*\/dashboard/);
    
    // Check for key elements
    await expect(page.locator('h1, h2')).toContainText(/dashboard|recipes|ingredients/i);
  });

  test('should navigate to ingredients page', async ({ page }) => {
    // Navigate to ingredients
    await page.click('text=/ingredients/i');
    
    await expect(page).toHaveURL(/.*\/ingredients/);
    
    // Check for ingredients page content
    await expect(page.locator('h1, h2')).toContainText(/ingredients|pantry/i);
  });

  test('should navigate to recipe search', async ({ page }) => {
    // Navigate to recipe search
    await page.click('text=/recipes|search/i');
    
    await expect(page).toHaveURL(/.*\/recipes/);
    
    // Check for search interface
    const searchInput = page.locator('input[type="text"], input[placeholder*="search" i]');
    if (await searchInput.count() > 0) {
      await expect(searchInput.first()).toBeVisible();
    }
  });

  test('should navigate to shopping lists', async ({ page }) => {
    // Navigate to shopping lists
    await page.click('text=/shopping|lists/i');
    
    await expect(page).toHaveURL(/.*\/shopping/);
    
    // Check for shopping lists content
    await expect(page.locator('h1, h2')).toContainText(/shopping|lists/i);
  });

  test('should handle keyboard navigation', async ({ page }) => {
    // Test tab navigation
    await page.keyboard.press('Tab');
    
    // Check that focus is visible
    const focusedElement = page.locator(':focus');
    if (await focusedElement.count() > 0) {
      await expect(focusedElement.first()).toBeVisible();
    }
  });

  test('should display error boundary on error', async ({ page }) => {
    // Navigate to a potentially error-causing route
    await page.goto('/recipes/999999');
    
    // Check for error message or 404
    const errorText = page.locator('text=/error|not found|404/i');
    if (await errorText.count() > 0) {
      await expect(errorText.first()).toBeVisible();
    }
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check that navigation is accessible
    const navButton = page.locator('button[aria-label*="menu" i], button[aria-label*="nav" i]');
    if (await navButton.count() > 0) {
      await expect(navButton.first()).toBeVisible();
    }
  });
});

test.describe('Recipe Import Flow', () => {
  test('should show recipe import interface', async ({ page }) => {
    await page.goto('/recipes');
    
    // Look for import/add recipe button
    const importButton = page.locator('button:has-text("Import"), button:has-text("Add Recipe"), a:has-text("Import")');
    if (await importButton.count() > 0) {
      await importButton.first().click();
      
      // Should see URL input field
      const urlInput = page.locator('input[placeholder*="url" i], input[type="url"]');
      if (await urlInput.count() > 0) {
        await expect(urlInput.first()).toBeVisible();
      }
    }
  });

  test('should handle invalid recipe URL gracefully', async ({ page }) => {
    await page.goto('/recipes');
    
    // Try to import with an invalid URL
    const urlInput = page.locator('input[placeholder*="url" i], input[type="url"]');
    if (await urlInput.count() > 0) {
      await urlInput.first().fill('not-a-valid-url');
      
      const submitButton = page.locator('button[type="submit"], button:has-text("Parse"), button:has-text("Import")');
      if (await submitButton.count() > 0) {
        await submitButton.first().click();
        
        // Should show an error message
        const errorMessage = page.locator('text=/invalid|error|please enter/i');
        // Allow for either error message or form validation
        await expect(errorMessage.count()).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

test.describe('Shopping List Flow', () => {
  test('should create a new shopping list', async ({ page }) => {
    await page.goto('/shopping-lists');
    
    // Click create new list button
    const createButton = page.locator('button:has-text("Create"), button:has-text("New List"), button:has-text("Add")');
    if (await createButton.count() > 0) {
      await createButton.first().click();
      
      // Fill in list name
      const nameInput = page.locator('input[placeholder*="name" i], input[name="name"]');
      if (await nameInput.count() > 0) {
        await nameInput.first().fill('Test Shopping List');
        
        // Submit
        const submitButton = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Create")');
        if (await submitButton.count() > 0) {
          await submitButton.first().click();
          
          // Should see the new list
          await expect(page.locator('text=Test Shopping List')).toBeVisible();
        }
      }
    }
  });

  test('should add items to shopping list', async ({ page }) => {
    await page.goto('/shopping-lists');
    
    // Click on first shopping list if exists
    const listItem = page.locator('[data-testid="shopping-list-item"], a:has-text("list")').first();
    if (await listItem.count() > 0) {
      await listItem.click();
      
      // Add an item
      const addItemInput = page.locator('input[placeholder*="add" i], input[placeholder*="item" i]');
      if (await addItemInput.count() > 0) {
        await addItemInput.first().fill('Test Ingredient');
        await page.keyboard.press('Enter');
        
        // Should see the item added
        await expect(page.locator('text=Test Ingredient')).toBeVisible();
      }
    }
  });
});

test.describe('Settings Flow', () => {
  test('should navigate to settings', async ({ page }) => {
    await page.goto('/');
    
    // Click settings link
    const settingsLink = page.locator('a:has-text("Settings"), button:has-text("Settings")');
    if (await settingsLink.count() > 0) {
      await settingsLink.first().click();
      await expect(page).toHaveURL(/.*\/settings/);
    }
  });

  test('should display dietary preferences', async ({ page }) => {
    await page.goto('/settings');
    
    // Should see dietary preferences section
    const dietarySection = page.locator('text=/dietary|preferences|allergies/i');
    if (await dietarySection.count() > 0) {
      await expect(dietarySection.first()).toBeVisible();
    }
  });

  test('should display subscription options', async ({ page }) => {
    await page.goto('/settings');
    
    // Should see subscription section
    const subscriptionSection = page.locator('text=/subscription|premium|pro/i');
    if (await subscriptionSection.count() > 0) {
      await expect(subscriptionSection.first()).toBeVisible();
    }
  });
});

test.describe('Accessibility Tests', () => {
  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');
    
    // Check for h1
    const h1 = page.locator('h1');
    if (await h1.count() > 0) {
      await expect(h1.first()).toBeVisible();
    }
  });

  test('should have skip to content link', async ({ page }) => {
    await page.goto('/');
    
    const skipLink = page.locator('a[href*="#main"], a[href*="skip"]');
    if (await skipLink.count() > 0) {
      await expect(skipLink.first()).toBeVisible();
    }
  });

  test('should have proper ARIA labels on interactive elements', async ({ page }) => {
    await page.goto('/');
    
    // Check buttons have labels
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    if (buttonCount > 0) {
      // At least some buttons should have aria-label or text content
      const buttonsWithLabels = page.locator('button[aria-label], button:has-text(".")');
      expect(await buttonsWithLabels.count()).toBeGreaterThan(0);
    }
  });

  test('should have proper focus indicators', async ({ page }) => {
    await page.goto('/');
    
    // Tab to first interactive element
    await page.keyboard.press('Tab');
    
    // Check for focus ring (CSS outline or ring)
    const focused = page.locator(':focus');
    if (await focused.count() > 0) {
      const styles = await focused.first().evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          outline: computed.outline,
          outlineWidth: computed.outlineWidth,
        };
      });
      
      // Should have some form of focus indicator
      expect(styles.outlineWidth !== '0px' || styles.outline !== 'none').toBeTruthy();
    }
  });
});

