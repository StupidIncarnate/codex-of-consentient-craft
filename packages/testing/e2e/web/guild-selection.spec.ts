import { mkdirSync } from 'fs';
import { test, expect } from '@playwright/test';
import {
  cleanGuilds,
  createGuild,
  createQuest,
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
    const guild = await createGuild(request, { name: 'Guild A', path: GUILD_A_PATH });
    const quest = await createQuest(request, {
      guildId: guild.id as string,
      title: 'Quest Alpha',
      userRequest: 'Test quest',
    });

    // Create a session file on disk linked to the quest via chat
    const sessionId = `e2e-session-guild-a-${Date.now()}`;
    createSessionFile({
      guildPath: GUILD_A_PATH,
      sessionId,
      userMessage: 'Quest Alpha session',
    });

    // Link session to the quest so it appears under quests-only filter
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
    await page.getByText('Guild A').click();

    await expect(page.getByTestId('GUILD_SESSION_LIST')).toBeVisible();
    // Quest title appears as a badge on the session item
    await expect(page.getByTestId(`SESSION_QUEST_BADGE_${sessionId}`)).toBeVisible();
    await expect(page.getByTestId(`SESSION_QUEST_BADGE_${sessionId}`)).toContainText('Quest Alpha');
  });

  test('click guild with no quests shows empty state', async ({ page, request }) => {
    await createGuild(request, { name: 'Empty Guild', path: EMPTY_GUILD_PATH });

    await page.goto('/');
    await page.getByText('Empty Guild').click();

    await expect(page.getByTestId('SESSION_EMPTY_STATE')).toBeVisible();
    await expect(page.getByText('No sessions yet')).toBeVisible();
  });

  test('switch between guilds refreshes session list', async ({ page, request }) => {
    const guildA = await createGuild(request, { name: 'Guild A', path: GUILD_A_PATH });
    const guildB = await createGuild(request, { name: 'Guild B', path: GUILD_B_PATH });

    const questA = await createQuest(request, {
      guildId: guildA.id as string,
      title: 'Quest Alpha',
      userRequest: 'Test',
    });
    const questB = await createQuest(request, {
      guildId: guildB.id as string,
      title: 'Quest Beta',
      userRequest: 'Test',
    });

    const sessionIdA = `e2e-session-a-${Date.now()}`;
    const sessionIdB = `e2e-session-b-${Date.now()}`;

    createSessionFile({
      guildPath: GUILD_A_PATH,
      sessionId: sessionIdA,
      userMessage: 'Quest Alpha session',
    });
    createSessionFile({
      guildPath: GUILD_B_PATH,
      sessionId: sessionIdB,
      userMessage: 'Quest Beta session',
    });

    // Link sessions to quests
    await request.patch(`/api/quests/${questA.questId}`, {
      data: {
        questId: questA.questId,
        chatSessions: [
          {
            sessionId: sessionIdA,
            startedAt: new Date().toISOString(),
            active: false,
            agentRole: 'test',
          },
        ],
      },
    });
    await request.patch(`/api/quests/${questB.questId}`, {
      data: {
        questId: questB.questId,
        chatSessions: [
          {
            sessionId: sessionIdB,
            startedAt: new Date().toISOString(),
            active: false,
            agentRole: 'test',
          },
        ],
      },
    });

    await page.goto('/');
    await page.getByText('Guild A').click();
    await expect(page.getByTestId(`SESSION_QUEST_BADGE_${sessionIdA}`)).toBeVisible();

    await page.getByText('Guild B').click();
    await expect(page.getByTestId(`SESSION_QUEST_BADGE_${sessionIdA}`)).not.toBeVisible();
    await expect(page.getByTestId(`SESSION_QUEST_BADGE_${sessionIdB}`)).toBeVisible();
  });
});
