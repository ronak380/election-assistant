import { test, expect } from '@playwright/test';

/**
 * @file tests/smoke.spec.ts
 * @description End-to-End Smoke Tests for the Election Assistant.
 *              Verifies that all major pages load and key interactive elements are present.
 */

test.describe('Election Assistant Smoke Tests', () => {
  
  test('homepage should load and show the main heading', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Election');
    await expect(page.getByRole('link', { name: 'Get Started' })).toBeVisible();
  });

  test('election timeline page should render animation cards', async ({ page }) => {
    await page.goto('/timeline');
    // The timeline heading uses a gradient-text span
    await expect(page.locator('h1, h2')).toContainText('Timeline');
    const cards = page.locator('.timeline-card');
    await expect(cards).toHaveCount({ min: 1 });
  });

  test('AI assistant page should show the chat input', async ({ page }) => {
    await page.goto('/assistant');
    await expect(page.getByPlaceholder(/type your question/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /send/i })).toBeVisible();
  });

  test('polling locator page should load the map container', async ({ page }) => {
    await page.goto('/locator');
    await expect(page.locator('#locator-heading')).toBeVisible();
    // Verify the map div is present
    const mapContainer = page.locator('.map-container');
    await expect(mapContainer).toBeVisible();
  });

  test('navigation should work between pages', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /AI Assistant/i }).first().click();
    await expect(page).toHaveURL(/.*assistant/);
  });
});
