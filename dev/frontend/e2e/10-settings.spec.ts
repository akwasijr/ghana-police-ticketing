import { test, expect } from './fixtures';

test.describe('Settings', () => {
  test('dashboard settings page loads', async ({ adminPage: page }) => {
    await page.goto('/dashboard/settings');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/setting/i).first()).toBeVisible();
  });

  test('super admin settings page loads', async ({ superAdminPage: page }) => {
    await page.goto('/super-admin/settings');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/setting/i).first()).toBeVisible();
  });

  test('handheld settings page loads', async ({ officerPage: page }) => {
    await page.goto('/handheld/settings');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/setting/i).first()).toBeVisible();
  });
});
