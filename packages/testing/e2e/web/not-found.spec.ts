import { test, expect } from './base-spec';
import { wireHarnessLifecycle } from './fixtures/harness-wire';
import { environmentHarness } from '../../test/harnesses/environment/environment.harness';
import { cleanGuilds, createGuild } from './fixtures/test-helpers';

const GUILD_PATH = '/tmp/dm-e2e-not-found';
const HTTP_OK = 200;
const HTTP_NOT_FOUND = 404;

wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

test.describe('Not Found', () => {
  test.beforeEach(async ({ request }) => {
    await cleanGuilds({ request });
  });

  test('bogus guild slug shows NOT FOUND', async ({ page, request }) => {
    await createGuild({ request, name: 'Real Guild', path: GUILD_PATH });

    const guildsResponsePromise = page.waitForResponse(
      (r) => r.url().includes('/api/guilds') && r.status() === HTTP_OK,
    );
    await page.goto('/bogus-guild-slug/session');
    await guildsResponsePromise;

    await expect(page.getByTestId('NOT_FOUND')).toBeVisible();
    await expect(page.getByText('NOT FOUND')).toBeVisible();
    await expect(
      page.getByText('The guild or session you are looking for does not exist.'),
    ).toBeVisible();

    await expect(page.getByTestId('CHAT_INPUT')).not.toBeVisible();
  });

  test('bogus guild slug with session ID shows NOT FOUND', async ({ page, request }) => {
    await createGuild({ request, name: 'Real Guild', path: GUILD_PATH });

    const guildsResponsePromise = page.waitForResponse(
      (r) => r.url().includes('/api/guilds') && r.status() === HTTP_OK,
    );
    await page.goto('/bogus-guild-slug/session/91c4944d-55e3-4231-bd48-140245f11867');
    await guildsResponsePromise;

    await expect(page.getByTestId('NOT_FOUND')).toBeVisible();
    await expect(page.getByText('NOT FOUND')).toBeVisible();

    await expect(page.getByTestId('CHAT_INPUT')).not.toBeVisible();
  });

  test('valid guild slug renders chat (no false positive)', async ({ page, request }) => {
    const guild = await createGuild({ request, name: 'Real Guild', path: GUILD_PATH });
    const urlSlug = String(guild.urlSlug ?? guild.name)
      .toLowerCase()
      .replace(/\s+/gu, '-');

    const guildsResponsePromise = page.waitForResponse(
      (r) => r.url().includes('/api/guilds') && r.status() === HTTP_OK,
    );
    await page.goto(`/${urlSlug}/session`);
    await guildsResponsePromise;

    await expect(page.getByTestId('CHAT_INPUT')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('NOT_FOUND')).not.toBeVisible();
  });

  test('valid guild slug with bogus session ID shows NOT FOUND', async ({ page, request }) => {
    const guild = await createGuild({ request, name: 'Real Guild', path: GUILD_PATH });
    const urlSlug = String(guild.urlSlug ?? guild.name)
      .toLowerCase()
      .replace(/\s+/gu, '-');

    const guildsResponsePromise = page.waitForResponse(
      (r) => r.url().includes('/api/guilds') && r.status() === HTTP_OK,
    );
    await page.goto(`/${urlSlug}/session/91c4944d-55e3-4231-bd48-140245f11`);
    await guildsResponsePromise;

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
