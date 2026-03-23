import { mkdirSync } from 'fs';
import { test, expect } from '@playwright/test';
import { cleanGuilds, createGuild } from './fixtures/test-helpers';

const GUILD_PATH = '/tmp/dm-e2e-not-found';
const HTTP_OK = 200;
const HTTP_NOT_FOUND = 404;

test.describe('Not Found', () => {
  test.beforeEach(async ({ request }) => {
    await cleanGuilds(request);
    mkdirSync(GUILD_PATH, { recursive: true });
  });

  test('bogus guild slug shows NOT FOUND', async ({ page, request }) => {
    await createGuild(request, { name: 'Real Guild', path: GUILD_PATH });

    await page.goto('/bogus-guild-slug/session');
    await page.waitForResponse((r) => r.url().includes('/api/guilds') && r.status() === HTTP_OK);

    await expect(page.getByTestId('NOT_FOUND')).toBeVisible();
    await expect(page.getByText('NOT FOUND')).toBeVisible();
    await expect(
      page.getByText('The guild or session you are looking for does not exist.'),
    ).toBeVisible();

    await expect(page.getByTestId('CHAT_INPUT')).not.toBeVisible();
  });

  test('bogus guild slug with session ID shows NOT FOUND', async ({ page, request }) => {
    await createGuild(request, { name: 'Real Guild', path: GUILD_PATH });

    await page.goto('/bogus-guild-slug/session/91c4944d-55e3-4231-bd48-140245f11867');
    await page.waitForResponse((r) => r.url().includes('/api/guilds') && r.status() === HTTP_OK);

    await expect(page.getByTestId('NOT_FOUND')).toBeVisible();
    await expect(page.getByText('NOT FOUND')).toBeVisible();

    await expect(page.getByTestId('CHAT_INPUT')).not.toBeVisible();
  });

  test('valid guild slug renders chat (no false positive)', async ({ page, request }) => {
    const guild = await createGuild(request, { name: 'Real Guild', path: GUILD_PATH });
    const urlSlug = String(guild.urlSlug ?? guild.name)
      .toLowerCase()
      .replace(/\s+/gu, '-');

    await page.goto(`/${urlSlug}/session`);
    await page.waitForResponse((r) => r.url().includes('/api/guilds') && r.status() === HTTP_OK);

    await expect(page.getByTestId('NOT_FOUND')).not.toBeVisible();
    await expect(page.getByTestId('CHAT_INPUT')).toBeVisible();
  });

  test('valid guild slug with bogus session ID shows NOT FOUND', async ({ page, request }) => {
    const guild = await createGuild(request, { name: 'Real Guild', path: GUILD_PATH });
    const urlSlug = String(guild.urlSlug ?? guild.name)
      .toLowerCase()
      .replace(/\s+/gu, '-');

    await page.goto(`/${urlSlug}/session/91c4944d-55e3-4231-bd48-140245f11`);
    await page.waitForResponse((r) => r.url().includes('/api/guilds') && r.status() === HTTP_OK);

    await expect(page.getByTestId('NOT_FOUND')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('NOT FOUND')).toBeVisible();

    await expect(page.getByTestId('CHAT_INPUT')).not.toBeVisible();
  });

  test('GET /api/guilds/:guildId returns 404 for nonexistent guild', async ({ request }) => {
    const response = await request.get('/api/guilds/91c4944d-55e3-4231-bd48-140245f11867');
    expect(response.status()).toBe(HTTP_NOT_FOUND);

    const body = await response.json();
    expect(body.error).toMatch(/^Guild not found/u);
  });
});
