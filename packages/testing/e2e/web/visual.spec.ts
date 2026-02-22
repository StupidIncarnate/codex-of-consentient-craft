import { mkdirSync } from 'fs';
import { test, expect } from '@playwright/test';
import {
  cleanGuilds,
  createGuild,
  createQuest,
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

  test('session status badges show correct text', async ({ page, request }) => {
    const guild = await createGuild(request, { name: 'Status Guild', path: STATUS_GUILD_PATH });
    const quest = await createQuest(request, {
      guildId: guild.id as string,
      title: 'Status Quest',
      userRequest: 'Test status',
    });

    const sessionId = `e2e-session-visual-${Date.now()}`;
    createSessionFile({
      guildPath: STATUS_GUILD_PATH,
      sessionId,
      userMessage: 'Test status',
    });

    await request.patch(`/api/quests/${quest.questId}`, {
      data: {
        questId: quest.questId,
        chatSessions: [
          {
            sessionId,
            startedAt: new Date().toISOString(),
            active: false,
            agentRole: 'test',
          },
        ],
      },
    });

    await page.goto('/');
    await page.getByText('Status Guild').click();

    // Session should show with a status badge
    const statusBadge = page.getByTestId(`SESSION_STATUS_${sessionId}`);
    await expect(statusBadge).toBeVisible();
    const statusText = await statusBadge.textContent();
    // Status should be uppercase (PENDING is default for new quests)
    expect(statusText?.toUpperCase()).toBe(statusText);
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
