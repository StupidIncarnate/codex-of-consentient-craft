import { mkdirSync } from 'fs';
import { test, expect } from '@playwright/test';
import {
  cleanGuilds,
  createGuild,
  createQuest,
  createSessionFile,
  cleanSessionFiles,
} from './fixtures/test-helpers';

const GUILD_PATH = '/tmp/dm-e2e-quest-creation';

const extractId = (obj: Record<string, unknown>) => `${obj.id}`;

test.describe('Quest Creation', () => {
  test.beforeEach(async ({ request }) => {
    await cleanGuilds(request);
    mkdirSync(GUILD_PATH, { recursive: true });
    cleanSessionFiles({ guildPath: GUILD_PATH });
  });

  test('quest created via API appears in session list', async ({ page, request }) => {
    const guild = await createGuild(request, { name: 'Quest Guild', path: GUILD_PATH });
    const guildId = extractId(guild);
    const quest = await createQuest(request, {
      guildId,
      title: 'My First Quest',
      userRequest: 'Build a feature',
    });

    const sessionId = `e2e-session-first-${Date.now()}`;
    createSessionFile({
      guildPath: GUILD_PATH,
      sessionId,
      userMessage: 'Build a feature',
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
    await page.getByText('Quest Guild').click();

    // Quest title appears as a badge on the session item
    await expect(page.getByText('My First Quest')).toBeVisible();
  });

  test('multiple quests show in session list', async ({ page, request }) => {
    const guild = await createGuild(request, { name: 'Multi Quest Guild', path: GUILD_PATH });
    const guildId = extractId(guild);

    const quest1 = await createQuest(request, { guildId, title: 'Quest One', userRequest: 'First task' });
    const quest2 = await createQuest(request, { guildId, title: 'Quest Two', userRequest: 'Second task' });
    const quest3 = await createQuest(request, { guildId, title: 'Quest Three', userRequest: 'Third task' });

    const now = Date.now();
    const sessions = [
      { questId: quest1.questId, sessionId: `e2e-session-1-${now}`, message: 'First task' },
      { questId: quest2.questId, sessionId: `e2e-session-2-${now}`, message: 'Second task' },
      { questId: quest3.questId, sessionId: `e2e-session-3-${now}`, message: 'Third task' },
    ];

    for (const s of sessions) {
      createSessionFile({
        guildPath: GUILD_PATH,
        sessionId: s.sessionId,
        userMessage: s.message,
      });
      await request.patch(`/api/quests/${s.questId}`, {
        data: {
          questId: s.questId,
          chatSessions: [
            {
              sessionId: s.sessionId,
              startedAt: new Date().toISOString(),
              active: false,
              agentRole: 'test',
            },
          ],
        },
      });
    }

    await page.goto('/');
    await page.getByText('Multi Quest Guild').click();

    // Quest titles appear as badges on session items
    await expect(page.getByText('Quest One')).toBeVisible();
    await expect(page.getByText('Quest Two')).toBeVisible();
    await expect(page.getByText('Quest Three')).toBeVisible();
  });

  test('session has correct status badge', async ({ page, request }) => {
    const guild = await createGuild(request, { name: 'Badge Guild', path: GUILD_PATH });
    const guildId = extractId(guild);
    const quest = await createQuest(request, {
      guildId,
      title: 'Status Quest',
      userRequest: 'Check status',
    });

    const sessionId = `e2e-session-status-${Date.now()}`;
    createSessionFile({
      guildPath: GUILD_PATH,
      sessionId,
      userMessage: 'Check status',
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
    await page.getByText('Badge Guild').click();

    // Session should be visible with its status badge
    const statusBadge = page.getByTestId(`SESSION_STATUS_${sessionId}`);
    await expect(statusBadge).toBeVisible();
  });
});
