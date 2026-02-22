import { mkdirSync } from 'fs';
import { test, expect } from '@playwright/test';
import {
  cleanGuilds,
  createGuild,
  createQuest,
  createSessionFile,
  cleanSessionFiles,
} from './fixtures/test-helpers';

const GUILD_PATH = '/tmp/dm-e2e-quest-detail';

test.describe('Quest Detail Navigation', () => {
  test.beforeEach(async ({ request }) => {
    await cleanGuilds(request);
    mkdirSync(GUILD_PATH, { recursive: true });
    cleanSessionFiles({ guildPath: GUILD_PATH });
  });

  test('click session item opens quest chat view', async ({ page, request }) => {
    const guild = await createGuild(request, { name: 'Test Guild', path: GUILD_PATH });
    const quest = await createQuest(request, {
      guildId: guild.id as string,
      title: 'My Quest',
      userRequest: 'Build something',
    });

    const sessionId = `e2e-session-detail-${Date.now()}`;
    createSessionFile({
      guildPath: GUILD_PATH,
      sessionId,
      userMessage: 'Build something',
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
    await page.getByText('Test Guild').click();
    await page.getByTestId(`SESSION_ITEM_${sessionId}`).click();

    // Quest chat view renders with chat panel and activity sidebar
    await expect(page.getByTestId('QUEST_CHAT')).toBeVisible();
    await expect(page.getByTestId('CHAT_PANEL')).toBeVisible();
    await expect(page.getByTestId('CHAT_INPUT')).toBeVisible();
    await expect(page.getByTestId('SEND_BUTTON')).toBeVisible();
    await expect(page.getByTestId('QUEST_CHAT_ACTIVITY')).toBeVisible();
  });

  test('quest chat view has input and activity panel', async ({ page, request }) => {
    const guild = await createGuild(request, { name: 'Tab Guild', path: GUILD_PATH });
    const quest = await createQuest(request, {
      guildId: guild.id as string,
      title: 'Tab Quest',
      userRequest: 'Test tabs',
    });

    const sessionId = `e2e-session-tab-${Date.now()}`;
    createSessionFile({
      guildPath: GUILD_PATH,
      sessionId,
      userMessage: 'Test tabs',
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
    await page.getByText('Tab Guild').click();
    await page.getByTestId(`SESSION_ITEM_${sessionId}`).click();

    // Chat input is functional
    await expect(page.getByTestId('CHAT_INPUT')).toBeEnabled();
    await expect(page.getByText('Awaiting quest activity...')).toBeVisible();

    // Divider separates chat and activity panels
    await expect(page.getByTestId('QUEST_CHAT_DIVIDER')).toBeVisible();
  });

  test('browser back returns to quest list', async ({ page, request }) => {
    const guild = await createGuild(request, { name: 'Back Guild', path: GUILD_PATH });
    const quest = await createQuest(request, {
      guildId: guild.id as string,
      title: 'Return Quest',
      userRequest: 'Test back',
    });

    const sessionId = `e2e-session-back-${Date.now()}`;
    createSessionFile({
      guildPath: GUILD_PATH,
      sessionId,
      userMessage: 'Test back',
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
    await page.getByText('Back Guild').click();
    await page.getByTestId(`SESSION_ITEM_${sessionId}`).click();
    await expect(page.getByTestId('QUEST_CHAT')).toBeVisible();

    await page.goBack();

    // Back to home — re-select guild to see session list
    await page.getByText('Back Guild').click();
    await expect(page.getByText('Return Quest')).toBeVisible();
    await expect(page.getByTestId('GUILD_SESSION_LIST')).toBeVisible();
  });
});
