import { mkdirSync } from 'fs';
import { test, expect } from '@playwright/test';
import {
  cleanGuilds,
  createGuild,
  queueClaudeResponse,
  clearClaudeQueue,
  cleanSessionFiles,
  SimpleTextResponseStub,
  ResumeResponseStub,
} from './fixtures/test-helpers';

const GUILD_PATH = '/tmp/dm-e2e-chat-history';
const HTTP_OK = 200;
const CHAT_TIMEOUT = 15_000;

const extractGuildId = (guild: Record<string, unknown>) => `${guild.id}`;

test.describe('Chat History & Sessions', () => {
  test.beforeEach(async ({ request }) => {
    await cleanGuilds(request);
    clearClaudeQueue();
    cleanSessionFiles({ guildPath: GUILD_PATH });
    mkdirSync(GUILD_PATH, { recursive: true });
  });

  test('chat response persists after page refresh', async ({ page, request }) => {
    const guild = await createGuild(request, { name: 'History Guild', path: GUILD_PATH });
    const guildId = extractGuildId(guild);

    queueClaudeResponse(SimpleTextResponseStub({ text: 'Persistent response' }));

    await page.goto(`/${guildId}/quest`);
    await page.waitForResponse(
      (resp) => resp.url().includes('/api/guilds') && resp.status() === HTTP_OK,
    );

    await page.getByTestId('CHAT_INPUT').fill('Remember this');
    await page.getByTestId('SEND_BUTTON').click();

    // Wait for response to appear
    await expect(page.getByText('Persistent response')).toBeVisible({ timeout: CHAT_TIMEOUT });

    // Refresh the page
    await page.goto(`/${guildId}/quest`);
    await page.waitForResponse(
      (resp) => resp.url().includes('/api/guilds') && resp.status() === HTTP_OK,
    );

    // Response should still be visible (loaded from history via JSONL file)
    await expect(page.getByText('Persistent response')).toBeVisible({ timeout: CHAT_TIMEOUT });
  });

  test('second message in session resumes', async ({ page, request }) => {
    const guild = await createGuild(request, { name: 'Resume Guild', path: GUILD_PATH });
    const guildId = extractGuildId(guild);

    // Queue first response (full session init)
    queueClaudeResponse(SimpleTextResponseStub({ text: 'First reply' }));

    await page.goto(`/${guildId}/quest`);
    await page.waitForResponse(
      (resp) => resp.url().includes('/api/guilds') && resp.status() === HTTP_OK,
    );

    // Send first message
    await page.getByTestId('CHAT_INPUT').fill('First message');
    await page.getByTestId('SEND_BUTTON').click();
    await expect(page.getByText('First reply')).toBeVisible({ timeout: CHAT_TIMEOUT });

    // Queue second response (resume — no init)
    queueClaudeResponse(ResumeResponseStub({ text: 'Second reply' }));

    // Send second message
    await page.getByTestId('CHAT_INPUT').fill('Second message');
    await page.getByTestId('SEND_BUTTON').click();
    await expect(page.getByText('Second reply')).toBeVisible({ timeout: CHAT_TIMEOUT });
  });
});
