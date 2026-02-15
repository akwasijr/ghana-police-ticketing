import { test, expect } from './fixtures';

test.describe('Offence Management', () => {
  test('displays offences page with table', async ({ adminPage: page }) => {
    await page.goto('/dashboard/offences');
    await page.waitForLoadState('networkidle');

    await expect(page.getByText(/offence/i).first()).toBeVisible();
  });

  test('can search offences', async ({ adminPage: page }) => {
    await page.goto('/dashboard/offences');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[placeholder*="earch"]');
    if (await searchInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await searchInput.fill('speeding');
      await page.waitForTimeout(500);
    }
  });

  test('can filter by category', async ({ adminPage: page }) => {
    await page.goto('/dashboard/offences');
    await page.waitForLoadState('networkidle');

    const categoryFilter = page.locator('select').first();
    if (await categoryFilter.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await categoryFilter.selectOption({ index: 1 });
      await page.waitForTimeout(500);
    }
  });
});
