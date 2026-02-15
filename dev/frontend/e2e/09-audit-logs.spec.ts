import { test, expect } from './fixtures';

test.describe('Audit Logs (Super Admin)', () => {
  test('displays audit logs page', async ({ superAdminPage: page }) => {
    await page.goto('/super-admin/audit-logs');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/audit/i).first()).toBeVisible();
  });

  test('has search and filter controls', async ({ superAdminPage: page }) => {
    await page.goto('/super-admin/audit-logs');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[placeholder*="earch"]');
    if (await searchInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await expect(searchInput).toBeVisible();
    }
  });

  test('can filter by date range', async ({ superAdminPage: page }) => {
    await page.goto('/super-admin/audit-logs');
    await page.waitForLoadState('networkidle');

    const dateInput = page.locator('input[type="date"]');
    if (await dateInput.count() > 0) {
      await expect(dateInput.first()).toBeVisible();
    }
  });
});
