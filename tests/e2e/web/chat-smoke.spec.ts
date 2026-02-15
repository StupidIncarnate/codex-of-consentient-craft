import { mkdirSync } from 'fs';
import { test, expect } from '@playwright/test';
import {
  cleanGuilds,
  createGuild,
  queueClaudeResponse,
  clearClaudeQueue,
  SimpleTextResponseStub,
} from './fixtures/test-helpers';

const GUILD_PATH = '/tmp/dm-e2e-chat-guild';

test.describe('Chat Smoke', () => {
  test.beforeEach(async ({ request }) => {
    await cleanGuilds(request);
    clearClaudeQueue();
    mkdirSync(GUILD_PATH, { recursive: true });
  });

  test('guild chat sends message and displays Claude response', async ({ page, request }) => {
    const guild = await createGuild(request, { name: 'Chat Guild', path: GUILD_PATH });
    const guildId = guild.id as string;

    queueClaudeResponse(SimpleTextResponseStub({ text: 'I can help with that!' }));

    await page.goto(`/${guildId}/quest`);
    await expect(page.getByTestId('CHAT_PANEL')).toBeVisible();

    // Wait for guilds API so guildId resolves before sending
    await page.waitForResponse(
      (resp) => resp.url().includes('/api/guilds') && resp.status() === 200,
    );

    const input = page.getByTestId('CHAT_INPUT');
    await input.fill('Hello Claude');
    await page.getByTestId('SEND_BUTTON').click();

    // User message should appear
    await expect(page.getByText('Hello Claude')).toBeVisible();

    // Wait for Claude response to appear
    await expect(page.getByText('I can help with that!')).toBeVisible({ timeout: 15_000 });
  });
});
