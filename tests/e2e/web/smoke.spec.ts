import { test, expect } from '@playwright/test';
import { cleanGuilds, createGuild } from './fixtures/test-helpers';

test.describe('Smoke Tests', () => {
  test('health endpoint responds', async ({ request }) => {
    const response = await request.get('http://localhost:3737/api/health');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.status).toBe('ok');
    expect(typeof body.timestamp).toBe('string');
  });

  test('app renders without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto('/');
    await expect(page.getByTestId('LOGO_ASCII')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('first-time empty state shows inline form', async ({ page, request }) => {
    await cleanGuilds(request);
    await page.goto('/');

    await expect(page.getByText('NEW GUILD')).toBeVisible();
    await expect(page.getByTestId('GUILD_NAME_INPUT')).toBeVisible();
    await expect(page.getByText('BROWSE')).toBeVisible();
    await expect(page.getByText('CREATE')).toBeVisible();
  });

  test('existing guilds load in guild list', async ({ page, request }) => {
    await cleanGuilds(request);
    await createGuild(request, { name: 'Guild Alpha', path: '/tmp/alpha' });
    await createGuild(request, { name: 'Guild Beta', path: '/tmp/beta' });

    await page.goto('/');
    await expect(page.getByText('Guild Alpha')).toBeVisible();
    await expect(page.getByText('Guild Beta')).toBeVisible();
    await expect(page.locator('button:has-text("+")')).toBeVisible();
  });

  test('no guild selected shows guidance text', async ({ page, request }) => {
    await cleanGuilds(request);
    await createGuild(request, { name: 'Some Guild', path: '/tmp/some' });

    await page.goto('/');
    await expect(page.getByText('Select a guild')).toBeVisible();
  });
});
