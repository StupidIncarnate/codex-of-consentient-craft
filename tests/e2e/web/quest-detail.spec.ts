import { test, expect } from '@playwright/test';
import { cleanGuilds, createGuild, createQuest } from './fixtures/test-helpers';

test.describe('Quest Detail Navigation', () => {
  test('click quest item opens detail view', async ({ page, request }) => {
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

    // Quest detail view
    await expect(page.getByText('My Quest')).toBeVisible();
    await expect(page.getByText('Back to list')).toBeVisible();
    // Tabs visible
    await expect(page.getByRole('tab', { name: /Overview/ })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Requirements/ })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Steps/ })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Contracts/ })).toBeVisible();
  });

  test('quest detail tabs are navigable', async ({ page, request }) => {
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

    // Click Requirements tab
    await page.getByRole('tab', { name: /Requirements/ }).click();
    await page.waitForTimeout(300);

    // Click Steps tab
    await page.getByRole('tab', { name: /Steps/ }).click();
    await page.waitForTimeout(300);

    // Click Contracts tab
    await page.getByRole('tab', { name: /Contracts/ }).click();
    await page.waitForTimeout(300);

    // Click Overview tab to go back
    await page.getByRole('tab', { name: /Overview/ }).click();
  });

  test('back to list returns to quest list', async ({ page, request }) => {
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
    await expect(page.getByText('Back to list')).toBeVisible();

    await page.getByText('Back to list').click();

    // Back to quest list
    await expect(page.getByText('Return Quest')).toBeVisible();
    await expect(page.getByTestId('GUILD_QUEST_LIST')).toBeVisible();
  });

  test.skip('quest detail with error shows error alert', async () => {
    // Requires mocking server responses - skipped for now
  });
});
