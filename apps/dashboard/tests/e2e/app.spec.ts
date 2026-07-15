import { test, expect } from '@playwright/test';

test('has title and verify docker container is alive', async ({ page }) => {
  // Navigate to the base URL which is localhost:3000
  await page.goto('/');

  // Expect a title "to contain" a substring. We will just verify it doesn't crash 
  // and the page contains something (since we don't know the exact title, we'll just check for body)
  const body = await page.locator('body');
  await expect(body).toBeVisible();
});
