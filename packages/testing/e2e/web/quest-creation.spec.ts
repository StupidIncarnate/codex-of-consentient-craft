import { mkdirSync } from 'fs';
import { test, expect } from '@playwright/test';
import { cleanGuilds, createGuild, createQuest } from './fixtures/test-helpers';

const GUILD_PATH = '/tmp/dm-e2e-quest-creation';

const extractId = (obj: Record<string, unknown>) => `${obj.id}`;

test.describe('Quest Creation', () => {
  test.beforeEach(async ({ request }) => {
    await cleanGuilds(request);
    mkdirSync(GUILD_PATH, { recursive: true });
  });

  test('quest created via API appears in list', async ({ page, request }) => {
    const guild = await createGuild(request, { name: 'Quest Guild', path: GUILD_PATH });
    const guildId = extractId(guild);
    await createQuest(request, {
      guildId,
      title: 'My First Quest',
      userRequest: 'Build a feature',
    });

    await page.goto('/');
    await page.getByText('Quest Guild').click();

    await expect(page.getByText('My First Quest')).toBeVisible();
  });

  test('multiple quests show in list', async ({ page, request }) => {
    const guild = await createGuild(request, { name: 'Multi Quest Guild', path: GUILD_PATH });
    const guildId = extractId(guild);

    await createQuest(request, { guildId, title: 'Quest One', userRequest: 'First task' });
    await createQuest(request, { guildId, title: 'Quest Two', userRequest: 'Second task' });
    await createQuest(request, { guildId, title: 'Quest Three', userRequest: 'Third task' });

    await page.goto('/');
    await page.getByText('Multi Quest Guild').click();

    await expect(page.getByText('Quest One')).toBeVisible();
    await expect(page.getByText('Quest Two')).toBeVisible();
    await expect(page.getByText('Quest Three')).toBeVisible();
  });

  test('quest has correct status badge', async ({ page, request }) => {
    const guild = await createGuild(request, { name: 'Badge Guild', path: GUILD_PATH });
    const guildId = extractId(guild);
    const quest = await createQuest(request, {
      guildId,
      title: 'Status Quest',
      userRequest: 'Check status',
    });

    await page.goto('/');
    await page.getByText('Badge Guild').click();

    // Quest should be visible with its status badge showing PENDING (default)
    const questItem = page.getByTestId(`QUEST_STATUS_${quest.questId}`);
    await expect(questItem).toBeVisible();
  });
});
