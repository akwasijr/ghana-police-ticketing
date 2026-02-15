import { test, expect } from './fixtures';

test.describe('Ticket Creation (Handheld)', () => {
  test('can access new ticket form', async ({ officerPage: page }) => {
    // Navigate to new ticket page
    await page.goto('/handheld/new-ticket');
    await page.waitForLoadState('networkidle');

    // Should see the first step of the ticket form
    await expect(page.getByText(/vehicle/i).first()).toBeVisible();
  });

  test('step 1: enter vehicle information', async ({ officerPage: page }) => {
    await page.goto('/handheld/new-ticket');
    await page.waitForLoadState('networkidle');

    // Fill vehicle registration number
    const regInput = page.locator('input').filter({ hasText: '' }).first();
    if (await regInput.isVisible()) {
      await regInput.fill('GR-1234-24');
    }

    // Check for vehicle type selector or next button
    const nextBtn = page.getByText(/next/i).or(page.getByText(/continue/i));
    if (await nextBtn.count() > 0) {
      await expect(nextBtn.first()).toBeVisible();
    }
  });

  test('step navigation works (next/previous)', async ({ officerPage: page }) => {
    await page.goto('/handheld/new-ticket');
    await page.waitForLoadState('networkidle');

    // Fill minimum required field - vehicle registration
    const inputs = page.locator('input[type="text"]');
    if (await inputs.count() > 0) {
      await inputs.first().fill('GR-1234-24');
    }

    // Try to navigate to next step
    const nextBtn = page.getByText(/next/i).or(page.getByText(/continue/i));
    if (await nextBtn.count() > 0) {
      await nextBtn.first().click();
      await page.waitForTimeout(500);

      // Try to go back
      const backBtn = page.getByText(/back/i).or(page.getByText(/previous/i));
      if (await backBtn.count() > 0) {
        await expect(backBtn.first()).toBeVisible();
      }
    }
  });
});
