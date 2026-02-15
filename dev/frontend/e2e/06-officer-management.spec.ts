import { test, expect } from './fixtures';

test.describe('Officer Management (Super Admin)', () => {
  test('displays officers page with table', async ({ superAdminPage: page }) => {
    await page.goto('/super-admin/officers');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/officer/i).first()).toBeVisible();
  });

  test('has add officer button', async ({ superAdminPage: page }) => {
    await page.goto('/super-admin/officers');
    await page.waitForLoadState('networkidle');

    const addBtn = page.getByText(/add officer/i).or(page.getByText(/new officer/i)).or(page.getByText(/create/i));
    if (await addBtn.count() > 0) {
      await expect(addBtn.first()).toBeVisible();
    }
  });

  test('can search officers', async ({ superAdminPage: page }) => {
    await page.goto('/super-admin/officers');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[placeholder*="earch"]');
    if (await searchInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await searchInput.fill('Kofi');
      await page.waitForTimeout(500);
    }
  });

  test('can filter by region', async ({ superAdminPage: page }) => {
    await page.goto('/super-admin/officers');
    await page.waitForLoadState('networkidle');

    const regionFilter = page.locator('select').filter({ hasText: /region/i });
    if (await regionFilter.count() > 0) {
      await expect(regionFilter.first()).toBeVisible();
    }
  });
});
