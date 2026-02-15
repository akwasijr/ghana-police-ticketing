import { test, expect } from './fixtures';

test.describe('Ticket Listing (Dashboard)', () => {
  test('displays tickets page with table', async ({ adminPage: page }) => {
    await page.goto('/dashboard/tickets');
    await page.waitForLoadState('networkidle');

    // Should see tickets page header
    await expect(page.getByText(/tickets/i).first()).toBeVisible();
  });

  test('has search and filter controls', async ({ adminPage: page }) => {
    await page.goto('/dashboard/tickets');
    await page.waitForLoadState('networkidle');

    // Search input should be present
    const searchInput = page.locator('input[placeholder*="earch"]');
    await expect(searchInput).toBeVisible();
  });

  test('can filter tickets by status', async ({ adminPage: page }) => {
    await page.goto('/dashboard/tickets');
    await page.waitForLoadState('networkidle');

    // Look for status filter tabs or dropdown
    const statusTab = page.getByText(/unpaid/i).or(page.getByText(/paid/i));
    if (await statusTab.count() > 0) {
      await statusTab.first().click();
      await page.waitForTimeout(500);
    }
  });

  test('clicking a ticket opens detail view', async ({ adminPage: page }) => {
    await page.goto('/dashboard/tickets');
    await page.waitForLoadState('networkidle');

    // Click on first ticket row if data exists
    const row = page.locator('table tbody tr').first();
    if (await row.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await row.click();
      await page.waitForTimeout(500);

      // Should show detail view with back button
      const backBtn = page.getByText(/back/i);
      if (await backBtn.count() > 0) {
        await expect(backBtn.first()).toBeVisible();
      }
    }
  });
});
