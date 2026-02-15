import { test as base, expect, type Page } from '@playwright/test';

// Demo credentials for each role
export const CREDENTIALS = {
  officer: { badge: 'GPS001', password: 'demo123' },
  admin: { badge: 'ADMIN01', password: 'admin123' },
  superAdmin: { badge: 'SUPER01', password: 'super123' },
} as const;

// Login helper - uses the demo quick-access flow
async function loginAs(page: Page, role: 'officer' | 'admin' | 'superAdmin') {
  const appType = role === 'officer' ? 'pda' : role === 'admin' ? 'admin' : 'super-admin';
  const creds = CREDENTIALS[role];

  await page.goto(`/login?app=${appType}`);
  await page.waitForLoadState('networkidle');

  // Fill badge number and password
  const badgeInput = page.locator('input[autocomplete="username"]');
  const passwordInput = page.locator('input[type="password"]');

  await badgeInput.fill(creds.badge);
  await passwordInput.fill(creds.password);

  // Submit form
  await page.locator('button[type="submit"]').click();

  // Wait for navigation away from login
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10_000 });
}

// Extended test fixture with login helpers
export const test = base.extend<{
  officerPage: Page;
  adminPage: Page;
  superAdminPage: Page;
}>({
  officerPage: async ({ page }, use) => {
    await loginAs(page, 'officer');
    await use(page);
  },
  adminPage: async ({ page }, use) => {
    await loginAs(page, 'admin');
    await use(page);
  },
  superAdminPage: async ({ page }, use) => {
    await loginAs(page, 'superAdmin');
    await use(page);
  },
});

export { expect, loginAs };
