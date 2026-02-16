import { test, expect } from '@playwright/test';
import { cleanGuilds, createGuild, createQuest } from './fixtures/test-helpers';

test.describe('Guild Selection & Quest Loading', () => {
  test('click guild loads its quest list', async ({ page, request }) => {
    await cleanGuilds(request);
    const guild = await createGuild(request, { name: 'Guild A', path: '/tmp/guild-a' });
    await createQuest(request, { guildId: guild.id as string, title: 'Quest Alpha', userRequest: 'Test quest' });

    await page.goto('/');
    await page.getByText('Guild A').click();

    await expect(page.getByTestId('GUILD_QUEST_LIST')).toBeVisible();
    await expect(page.getByText('Quest Alpha')).toBeVisible();
  });

  test('click guild with no quests shows empty state', async ({ page, request }) => {
    await cleanGuilds(request);
    await createGuild(request, { name: 'Empty Guild', path: '/tmp/empty' });

    await page.goto('/');
    await page.getByText('Empty Guild').click();

    await expect(page.getByTestId('QUEST_EMPTY_STATE')).toBeVisible();
    await expect(page.getByText('No quests yet')).toBeVisible();
  });

  test('switch between guilds refreshes quest list', async ({ page, request }) => {
    await cleanGuilds(request);
    const guildA = await createGuild(request, { name: 'Guild A', path: '/tmp/guild-a' });
    const guildB = await createGuild(request, { name: 'Guild B', path: '/tmp/guild-b' });
    await createQuest(request, { guildId: guildA.id as string, title: 'Quest Alpha', userRequest: 'Test' });
    await createQuest(request, { guildId: guildB.id as string, title: 'Quest Beta', userRequest: 'Test' });

    await page.goto('/');
    await page.getByText('Guild A').click();
    await expect(page.getByText('Quest Alpha')).toBeVisible();

    await page.getByText('Guild B').click();
    await expect(page.getByText('Quest Alpha')).not.toBeVisible();
    await expect(page.getByText('Quest Beta')).toBeVisible();
  });
});
