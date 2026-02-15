import { test, expect, CREDENTIALS, loginAs } from './fixtures';

test.describe('Authentication', () => {
  test('shows launcher page with three app choices', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('PDA')).toBeVisible();
    await expect(page.getByText('Admin')).toBeVisible();
    await expect(page.getByText('Super Admin')).toBeVisible();
  });

  test('redirects unauthenticated user to login', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL('**/login**');
    await expect(page).toHaveURL(/\/login/);
  });

  test('officer login with badge number navigates to handheld', async ({ page }) => {
    await loginAs(page, 'officer');
    await expect(page).toHaveURL(/\/handheld/);
  });

  test('admin login navigates to dashboard', async ({ page }) => {
    await loginAs(page, 'admin');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('super admin login navigates to super-admin', async ({ page }) => {
    await loginAs(page, 'superAdmin');
    await expect(page).toHaveURL(/\/super-admin/);
  });

  test('invalid credentials show error', async ({ page }) => {
    await page.goto('/login?app=pda');
    await page.locator('input[autocomplete="username"]').fill('INVALID');
    await page.locator('input[type="password"]').fill('wrong');
    await page.locator('button[type="submit"]').click();

    // Should stay on login and show error
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText(/invalid/i)).toBeVisible({ timeout: 5_000 });
  });

  test('logout returns to login page', async ({ page }) => {
    await loginAs(page, 'admin');
    await expect(page).toHaveURL(/\/dashboard/);

    // Click logout (sidebar or menu)
    const logoutBtn = page.getByText('Logout').or(page.getByText('Sign Out')).or(page.getByText('Log out'));
    if (await logoutBtn.count() > 0) {
      await logoutBtn.first().click();
      await page.waitForURL('**/login**');
      await expect(page).toHaveURL(/\/login/);
    }
  });
});
