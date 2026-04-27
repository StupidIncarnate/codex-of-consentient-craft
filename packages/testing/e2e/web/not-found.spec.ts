import { test, expect, wireHarnessLifecycle } from '@dungeonmaster/testing/e2e';
import { environmentHarness } from '../../test/harnesses/environment/environment.harness';
import { guildHarness } from '../../test/harnesses/guild/guild.harness';

const GUILD_PATH = '/tmp/dm-e2e-not-found';
const HTTP_OK = 200;
const HTTP_NOT_FOUND = 404;

wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

test.describe('Not Found', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
  });

  test('ERROR: bogus guild slug shows NOT FOUND', async ({ page, request }) => {
    await guildHarness({ request }).createGuild({ name: 'Real Guild', path: GUILD_PATH });

    const guildsResponsePromise = page.waitForResponse(
      (r) => r.url().includes('/api/guilds') && r.status() === HTTP_OK,
    );
    await page.goto('/bogus-guild-slug/quest');
    await guildsResponsePromise;

    await expect(page.getByTestId('NOT_FOUND')).toBeVisible();
    await expect(page.getByText('NOT FOUND')).toBeVisible();
    await expect(page.getByText('The guild you are looking for does not exist.')).toBeVisible();

    await expect(page.getByTestId('CHAT_INPUT')).not.toBeVisible();
  });

  test('ERROR: bogus guild slug with session ID shows NOT FOUND', async ({ page, request }) => {
    await guildHarness({ request }).createGuild({ name: 'Real Guild', path: GUILD_PATH });

    const guildsResponsePromise = page.waitForResponse(
      (r) => r.url().includes('/api/guilds') && r.status() === HTTP_OK,
    );
    await page.goto('/bogus-guild-slug/session/91c4944d-55e3-4231-bd48-140245f11867');
    await guildsResponsePromise;

    await expect(page.getByTestId('NOT_FOUND')).toBeVisible();
    await expect(page.getByText('NOT FOUND')).toBeVisible();

    await expect(page.getByTestId('CHAT_INPUT')).not.toBeVisible();
  });

  test('EDGE: valid guild slug renders chat (no false positive)', async ({ page, request }) => {
    const guild = await guildHarness({ request }).createGuild({
      name: 'Real Guild',
      path: GUILD_PATH,
    });
    const urlSlug = String(guild.urlSlug ?? guild.name)
      .toLowerCase()
      .replace(/\s+/gu, '-');

    const guildsResponsePromise = page.waitForResponse(
      (r) => r.url().includes('/api/guilds') && r.status() === HTTP_OK,
    );
    await page.goto(`/${urlSlug}/quest`);
    await guildsResponsePromise;

    await expect(page.getByTestId('CHAT_INPUT')).toBeVisible();
    await expect(page.getByTestId('NOT_FOUND')).not.toBeVisible();
  });

  test('ERROR: valid guild slug with bogus session ID shows NOT FOUND', async ({
    page,
    request,
  }) => {
    const guild = await guildHarness({ request }).createGuild({
      name: 'Real Guild',
      path: GUILD_PATH,
    });
    const urlSlug = String(guild.urlSlug ?? guild.name)
      .toLowerCase()
      .replace(/\s+/gu, '-');

    const guildsResponsePromise = page.waitForResponse(
      (r) => r.url().includes('/api/guilds') && r.status() === HTTP_OK,
    );
    await page.goto(`/${urlSlug}/session/91c4944d-55e3-4231-bd48-140245f11`);
    await guildsResponsePromise;

    await expect(page.getByTestId('NOT_FOUND')).toBeVisible();
    await expect(page.getByText('NOT FOUND')).toBeVisible();

    await expect(page.getByTestId('CHAT_INPUT')).not.toBeVisible();
  });

  test('ERROR: GET /api/guilds/:guildId returns 404 for nonexistent guild', async ({ request }) => {
    const response = await request.get('/api/guilds/91c4944d-55e3-4231-bd48-140245f11867');

    expect(response.status()).toBe(HTTP_NOT_FOUND);

    const body = await response.json();

    expect(body.error).toMatch(/^Guild not found: [0-9a-f-]+$/u);
  });
});
