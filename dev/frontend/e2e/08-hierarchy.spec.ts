import { test, expect } from './fixtures';

test.describe('Hierarchy Management', () => {
  test('displays stations page with data', async ({ adminPage: page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Navigate to stations via sidebar if available
    const stationsLink = page.getByText(/station/i);
    if (await stationsLink.count() > 0) {
      await stationsLink.first().click();
      await page.waitForLoadState('networkidle');
    }
  });

  test('super admin can view regions', async ({ superAdminPage: page }) => {
    await page.goto('/super-admin/regions');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/region/i).first()).toBeVisible();
  });

  test('super admin can view stations', async ({ superAdminPage: page }) => {
    await page.goto('/super-admin/stations');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/station/i).first()).toBeVisible();
  });
});
