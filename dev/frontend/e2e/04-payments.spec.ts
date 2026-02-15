import { test, expect } from './fixtures';

test.describe('Payments (Dashboard)', () => {
  test('displays payments page with stats', async ({ adminPage: page }) => {
    await page.goto('/dashboard/payments');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/payments/i).first()).toBeVisible();
    // Should see KPI cards
    await expect(page.getByText(/total revenue/i).or(page.getByText(/successful/i))).toBeVisible();
  });

  test('has payment status tabs', async ({ adminPage: page }) => {
    await page.goto('/dashboard/payments');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/all payments/i)).toBeVisible();
    await expect(page.getByText(/completed/i).first()).toBeVisible();
    await expect(page.getByText(/failed/i).first()).toBeVisible();
  });

  test('can search payments', async ({ adminPage: page }) => {
    await page.goto('/dashboard/payments');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[placeholder*="earch"]');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('test');
    await page.waitForTimeout(500);
  });

  test('clicking a payment shows detail view', async ({ adminPage: page }) => {
    await page.goto('/dashboard/payments');
    await page.waitForLoadState('networkidle');

    const row = page.locator('table tbody tr').first();
    if (await row.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await row.click();
      await page.waitForTimeout(500);

      // Detail view should show reference and amount
      await expect(page.getByText(/payment details/i).or(page.getByText(/reference/i))).toBeVisible();
    }
  });
});
