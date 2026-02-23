import { mkdirSync } from 'fs';
import { test, expect } from '@playwright/test';
import {
  cleanGuilds,
  createGuild,
  createSessionFile,
  cleanSessionFiles,
} from './fixtures/test-helpers';

const GUILD_A_PATH = '/tmp/dm-e2e-guild-a';
const GUILD_B_PATH = '/tmp/dm-e2e-guild-b';
const EMPTY_GUILD_PATH = '/tmp/dm-e2e-empty';

test.describe('Guild Selection & Session Loading', () => {
  test.beforeEach(async ({ request }) => {
    await cleanGuilds(request);
    mkdirSync(GUILD_A_PATH, { recursive: true });
    mkdirSync(GUILD_B_PATH, { recursive: true });
    mkdirSync(EMPTY_GUILD_PATH, { recursive: true });
    cleanSessionFiles({ guildPath: GUILD_A_PATH });
    cleanSessionFiles({ guildPath: GUILD_B_PATH });
    cleanSessionFiles({ guildPath: EMPTY_GUILD_PATH });
  });

  test('click guild loads its session list', async ({ page, request }) => {
    await createGuild(request, { name: 'Guild A', path: GUILD_A_PATH });

    const sessionId = `e2e-session-guild-a-${Date.now()}`;
    createSessionFile({
      guildPath: GUILD_A_PATH,
      sessionId,
      userMessage: 'Quest Alpha session',
    });

    await page.goto('/');
    await page.getByText('Guild A').click();
    await page.getByTestId('SESSION_FILTER').getByText('All').click();

    await expect(page.getByTestId('GUILD_SESSION_LIST')).toBeVisible();
    await expect(page.getByTestId(`SESSION_ITEM_${sessionId}`)).toBeVisible();
    await expect(page.getByText('Quest Alpha session')).toBeVisible();
  });

  test('click guild with no quests shows empty state', async ({ page, request }) => {
    await createGuild(request, { name: 'Empty Guild', path: EMPTY_GUILD_PATH });

    await page.goto('/');
    await page.getByText('Empty Guild').click();

    await expect(page.getByTestId('SESSION_EMPTY_STATE')).toBeVisible();
    await expect(page.getByText('No sessions yet')).toBeVisible();
  });

  test('switch between guilds refreshes session list', async ({ page, request }) => {
    await createGuild(request, { name: 'Guild A', path: GUILD_A_PATH });
    await createGuild(request, { name: 'Guild B', path: GUILD_B_PATH });

    const sessionIdA = `e2e-session-a-${Date.now()}`;
    const sessionIdB = `e2e-session-b-${Date.now()}`;

    createSessionFile({
      guildPath: GUILD_A_PATH,
      sessionId: sessionIdA,
      userMessage: 'Alpha session',
    });
    createSessionFile({
      guildPath: GUILD_B_PATH,
      sessionId: sessionIdB,
      userMessage: 'Beta session',
    });

    await page.goto('/');
    await page.getByText('Guild A').click();
    await page.getByTestId('SESSION_FILTER').getByText('All').click();
    await expect(page.getByTestId(`SESSION_ITEM_${sessionIdA}`)).toBeVisible();

    await page.getByText('Guild B').click();
    await page.getByTestId('SESSION_FILTER').getByText('All').click();
    await expect(page.getByTestId(`SESSION_ITEM_${sessionIdA}`)).not.toBeVisible();
    await expect(page.getByTestId(`SESSION_ITEM_${sessionIdB}`)).toBeVisible();
  });
});
