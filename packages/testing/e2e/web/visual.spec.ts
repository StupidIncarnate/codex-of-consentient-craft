import { mkdirSync } from 'fs';
import { test, expect } from '@playwright/test';
import {
  cleanGuilds,
  createGuild,
  createSessionFile,
  cleanSessionFiles,
} from './fixtures/test-helpers';

const GUILD_A_PATH = '/tmp/dm-e2e-visual-a';
const GUILD_B_PATH = '/tmp/dm-e2e-visual-b';
const GUILD_C_PATH = '/tmp/dm-e2e-visual-c';
const STATUS_GUILD_PATH = '/tmp/dm-e2e-visual-status';

test.describe('Status Badges & Visual', () => {
  test.beforeEach(async ({ request }) => {
    await cleanGuilds(request);
    for (const p of [GUILD_A_PATH, GUILD_B_PATH, GUILD_C_PATH, STATUS_GUILD_PATH]) {
      mkdirSync(p, { recursive: true });
      cleanSessionFiles({ guildPath: p });
    }
  });

  test('selected guild has gold highlight', async ({ page, request }) => {
    const guildA = await createGuild(request, { name: 'Guild A', path: GUILD_A_PATH });
    const guildB = await createGuild(request, { name: 'Guild B', path: GUILD_B_PATH });

    await page.goto('/');
    await page.getByTestId(`GUILD_ITEM_${guildA.id}`).click();

    // Selected guild should have gold-colored styling
    const selectedGuild = page.getByTestId(`GUILD_ITEM_${guildA.id}`);
    await expect(selectedGuild).toBeVisible();
    // Check it has a distinct style (gold color on text)
    const color = await selectedGuild.evaluate((el) => getComputedStyle(el).color);
    expect(color).toBeTruthy();

    // Unselected guild should have different styling
    const unselectedGuild = page.getByTestId(`GUILD_ITEM_${guildB.id}`);
    const unselectedColor = await unselectedGuild.evaluate((el) => getComputedStyle(el).color);
    expect(color).not.toBe(unselectedColor);
  });

  test('session items display summary text', async ({ page, request }) => {
    await createGuild(request, { name: 'Status Guild', path: STATUS_GUILD_PATH });

    const sessionId = `e2e-session-visual-${Date.now()}`;
    createSessionFile({
      guildPath: STATUS_GUILD_PATH,
      sessionId,
      userMessage: 'Test status',
    });

    await page.goto('/');
    await page.getByText('Status Guild').click();
    await page.getByTestId('SESSION_FILTER').getByText('All').click();

    const sessionItem = page.getByTestId(`SESSION_ITEM_${sessionId}`);
    await expect(sessionItem).toBeVisible();
    await expect(page.getByText('Test status')).toBeVisible();
  });

  test('multiple guilds all visible', async ({ page, request }) => {
    await createGuild(request, { name: 'Guild A', path: GUILD_A_PATH });
    await createGuild(request, { name: 'Guild B', path: GUILD_B_PATH });
    await createGuild(request, { name: 'Guild C', path: GUILD_C_PATH });

    await page.goto('/');

    await expect(page.getByText('Guild A')).toBeVisible();
    await expect(page.getByText('Guild B')).toBeVisible();
    await expect(page.getByText('Guild C')).toBeVisible();
  });
});
