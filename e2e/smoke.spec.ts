import { expect, test } from '@playwright/test';

/**
 * End-to-end smoke test: boots the production build in a real browser, starts a
 * flight and verifies the WebGL canvas and HUD come up. Runs on both a desktop
 * and a mobile viewport (see playwright.config.ts).
 */
test('loads, starts a flight, and renders the simulator', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('/');

  // Main menu is visible.
  await expect(page.getByText('SKYWARD')).toBeVisible();

  // Start the flight.
  await page.getByRole('button', { name: /start flight/i }).click();

  // The WebGL canvas should be present and sized.
  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible();
  const box = await canvas.boundingBox();
  expect(box?.width ?? 0).toBeGreaterThan(0);
  expect(box?.height ?? 0).toBeGreaterThan(0);

  // HUD gauges are present.
  await expect(page.getByLabelText(/airspeed in knots/i)).toBeVisible();
  await expect(page.getByLabelText(/altitude in feet/i)).toBeVisible();

  // Pause via the top bar, confirming controls work.
  await page.getByRole('button', { name: /^pause$/i }).click();
  await expect(page.getByRole('dialog', { name: /paused/i })).toBeVisible();

  // No uncaught page errors during boot.
  expect(errors, errors.join('\n')).toHaveLength(0);
});
