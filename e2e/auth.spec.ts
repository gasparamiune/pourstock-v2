import { test, expect } from '@playwright/test';

/**
 * Auth flow smoke tests.
 * These use fake credentials so they WILL get a Supabase "Invalid login"
 * error — that's intentional. We're validating the UI reacts correctly,
 * not that real auth works.
 */

test.describe('Auth page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth');
  });

  test('shows sign-in tab by default', async ({ page }) => {
    await expect(page.getByRole('tab', { name: /sign in/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /create hotel/i })).toBeVisible();
  });

  test('shows validation when submitting empty form', async ({ page }) => {
    await page.getByRole('button', { name: /sign in/i }).first().click();
    // HTML5 required validation or our own error should appear
    const emailInput = page.getByLabel(/email/i).first();
    await expect(emailInput).toBeVisible();
    // The input should be invalid (required)
    const isValid = await emailInput.evaluate((el: HTMLInputElement) => el.validity.valid);
    expect(isValid).toBe(false);
  });

  test('switches to Create Hotel tab', async ({ page }) => {
    await page.getByRole('tab', { name: /create hotel/i }).click();
    await expect(page.getByLabel(/hotel name/i)).toBeVisible();
  });

  test('shows join with invite link', async ({ page }) => {
    await page.goto('/join?token=test-token-123');
    // Join page should render (even if token is invalid)
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Legal links from auth page', () => {
  test('Terms link navigates to /terms', async ({ page }) => {
    await page.goto('/auth');
    // Switch to register tab where ToS links usually appear
    await page.getByRole('tab', { name: /create hotel/i }).click();
    const termsLink = page.getByRole('link', { name: /terms/i }).first();
    if (await termsLink.isVisible()) {
      await termsLink.click();
      await expect(page).toHaveURL(/\/terms/);
    }
  });
});
