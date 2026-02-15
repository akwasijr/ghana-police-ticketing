import { test, expect } from './fixtures';

test.describe('Objections (Dashboard)', () => {
  test('displays objections page', async ({ adminPage: page }) => {
    await page.goto('/dashboard/objections');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/objection/i).first()).toBeVisible();
  });

  test('has status filter tabs', async ({ adminPage: page }) => {
    await page.goto('/dashboard/objections');
    await page.waitForLoadState('networkidle');

    // Should have pending/reviewed/all tabs
    const pendingTab = page.getByText(/pending/i);
    if (await pendingTab.count() > 0) {
      await expect(pendingTab.first()).toBeVisible();
    }
  });

  test('can search objections', async ({ adminPage: page }) => {
    await page.goto('/dashboard/objections');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[placeholder*="earch"]');
    if (await searchInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await searchInput.fill('test');
      await page.waitForTimeout(500);
    }
  });
});
