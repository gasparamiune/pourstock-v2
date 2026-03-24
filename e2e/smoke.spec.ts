import { test, expect } from '@playwright/test';

/**
 * Smoke tests — verify the app shell loads and public routes respond correctly.
 * These tests do NOT require a real Supabase connection; they check the SPA
 * scaffolding and static routes only.
 */

test.describe('Public routes', () => {
  test('health endpoint returns JSON status ok', async ({ page }) => {
    await page.goto('/health');
    const body = await page.locator('pre').textContent();
    const json = JSON.parse(body ?? '{}');
    expect(json.status).toBe('ok');
    expect(json.app).toBe('pourstock');
  });

  test('unauthenticated root redirects to /auth', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/auth/);
  });

  test('/auth page renders sign-in form', async ({ page }) => {
    await page.goto('/auth');
    // Email input must be present
    await expect(page.getByLabel(/email/i).first()).toBeVisible();
    // Password input must be present
    await expect(page.getByLabel(/password/i).first()).toBeVisible();
  });

  test('/terms page renders Terms of Service heading', async ({ page }) => {
    await page.goto('/terms');
    await expect(page.getByRole('heading', { name: /terms of service/i })).toBeVisible();
  });

  test('/privacy page renders Privacy Policy heading', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page.getByRole('heading', { name: /privacy policy/i })).toBeVisible();
  });

  test('/cookies page renders Cookie Policy heading', async ({ page }) => {
    await page.goto('/cookies');
    await expect(page.getByRole('heading', { name: /cookie policy/i })).toBeVisible();
  });
});

test.describe('Cookie banner', () => {
  test('banner appears on first visit and hides after accept', async ({ page }) => {
    // Clear localStorage so banner shows
    await page.goto('/auth');
    await page.evaluate(() => localStorage.removeItem('cookie-consent'));
    await page.reload();
    const banner = page.getByText(/we use cookies/i);
    await expect(banner).toBeVisible();
    await page.getByRole('button', { name: /accept all/i }).click();
    await expect(banner).not.toBeVisible();
  });

  test('banner does not appear when consent already stored', async ({ page }) => {
    await page.goto('/auth');
    await page.evaluate(() => localStorage.setItem('cookie-consent', 'accepted'));
    await page.reload();
    await expect(page.getByText(/we use cookies/i)).not.toBeVisible();
  });
});
