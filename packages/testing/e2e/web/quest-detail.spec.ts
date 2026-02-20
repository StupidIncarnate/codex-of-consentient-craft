import { test, expect } from '@playwright/test';
import { cleanGuilds, createGuild, createQuest } from './fixtures/test-helpers';

test.describe('Quest Detail Navigation', () => {
  test('click quest item opens quest chat view', async ({ page, request }) => {
    await cleanGuilds(request);
    const guild = await createGuild(request, { name: 'Test Guild', path: '/tmp/test' });
    const quest = await createQuest(request, {
      guildId: guild.id as string,
      title: 'My Quest',
      userRequest: 'Build something',
    });

    await page.goto('/');
    await page.getByText('Test Guild').click();
    await page.getByTestId(`QUEST_ITEM_${quest.questId}`).click();

    // Quest chat view renders with chat panel and activity sidebar
    await expect(page.getByTestId('QUEST_CHAT')).toBeVisible();
    await expect(page.getByTestId('CHAT_PANEL')).toBeVisible();
    await expect(page.getByTestId('CHAT_INPUT')).toBeVisible();
    await expect(page.getByTestId('SEND_BUTTON')).toBeVisible();
    await expect(page.getByTestId('QUEST_CHAT_ACTIVITY')).toBeVisible();
  });

  test('quest chat view has input and activity panel', async ({ page, request }) => {
    await cleanGuilds(request);
    const guild = await createGuild(request, { name: 'Tab Guild', path: '/tmp/tab' });
    const quest = await createQuest(request, {
      guildId: guild.id as string,
      title: 'Tab Quest',
      userRequest: 'Test tabs',
    });

    await page.goto('/');
    await page.getByText('Tab Guild').click();
    await page.getByTestId(`QUEST_ITEM_${quest.questId}`).click();

    // Chat input is functional
    await expect(page.getByTestId('CHAT_INPUT')).toBeEnabled();
    await expect(page.getByText('Awaiting quest activity...')).toBeVisible();

    // Divider separates chat and activity panels
    await expect(page.getByTestId('QUEST_CHAT_DIVIDER')).toBeVisible();
  });

  test('browser back returns to quest list', async ({ page, request }) => {
    await cleanGuilds(request);
    const guild = await createGuild(request, { name: 'Back Guild', path: '/tmp/back' });
    const quest = await createQuest(request, {
      guildId: guild.id as string,
      title: 'Return Quest',
      userRequest: 'Test back',
    });

    await page.goto('/');
    await page.getByText('Back Guild').click();
    await page.getByTestId(`QUEST_ITEM_${quest.questId}`).click();
    await expect(page.getByTestId('QUEST_CHAT')).toBeVisible();

    await page.goBack();

    // Back to home — re-select guild to see quest list
    await page.getByText('Back Guild').click();
    await expect(page.getByText('Return Quest')).toBeVisible();
    await expect(page.getByTestId('GUILD_QUEST_LIST')).toBeVisible();
  });
});
