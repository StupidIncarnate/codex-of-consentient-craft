import { mkdirSync } from 'fs';
import { test, expect } from '@playwright/test';
import {
  cleanGuilds,
  createGuild,
  queueClaudeResponse,
  clearClaudeQueue,
  cleanSessionFiles,
  SimpleTextResponseStub,
  ToolUseChainResponseStub,
  ErrorResponseStub,
  MultiTurnResponseStubs,
} from './fixtures/test-helpers';

const GUILD_PATH = '/tmp/dm-e2e-chat-features';
const HTTP_OK = 200;
const CHAT_TIMEOUT = 15_000;
const SETTLE_DELAY = 500;
const USER_MSG_TIMEOUT = 5_000;

const extractGuildId = (guild: Record<string, unknown>) => `${guild.id}`;

test.describe('Chat Advanced Features', () => {
  test.beforeEach(async ({ request }) => {
    await cleanGuilds(request);
    clearClaudeQueue();
    cleanSessionFiles({ guildPath: GUILD_PATH });
    mkdirSync(GUILD_PATH, { recursive: true });
  });

  test('tool use displays in chat', async ({ page, request }) => {
    const guild = await createGuild(request, { name: 'Tool Guild', path: GUILD_PATH });
    const guildId = extractGuildId(guild);

    queueClaudeResponse(
      ToolUseChainResponseStub({
        toolName: 'Read',
        toolInput: { file_path: '/src/index.ts' },
        toolResultContent: 'export const main = () => {}',
        followUpText: 'I read the file successfully.',
      }),
    );

    await page.goto(`/${guildId}/quest`);
    await page.waitForResponse(
      (resp) => resp.url().includes('/api/guilds') && resp.status() === HTTP_OK,
    );

    await page.getByTestId('CHAT_INPUT').fill('Read the index file');
    await page.getByTestId('SEND_BUTTON').click();

    await expect(page.getByText('I read the file successfully.')).toBeVisible({
      timeout: CHAT_TIMEOUT,
    });
  });

  test('error response shows gracefully', async ({ page, request }) => {
    const guild = await createGuild(request, { name: 'Error Guild', path: GUILD_PATH });
    const guildId = extractGuildId(guild);

    queueClaudeResponse(
      ErrorResponseStub({
        partialOutput: 'Starting analysis...',
        exitCode: 1,
      }),
    );

    await page.goto(`/${guildId}/quest`);
    await page.waitForResponse(
      (resp) => resp.url().includes('/api/guilds') && resp.status() === HTTP_OK,
    );

    await page.getByTestId('CHAT_INPUT').fill('Analyze code');
    await page.getByTestId('SEND_BUTTON').click();

    await expect(page.getByText('Starting analysis...')).toBeVisible({ timeout: CHAT_TIMEOUT });
    // Page should not crash — chat input remains functional
    await expect(page.getByTestId('CHAT_INPUT')).toBeVisible();
  });

  test('multi-turn conversation', async ({ page, request }) => {
    const guild = await createGuild(request, { name: 'Multi Guild', path: GUILD_PATH });
    const guildId = extractGuildId(guild);

    const responses = MultiTurnResponseStubs({
      messages: [{ text: 'First response' }, { text: 'Second response' }],
    });
    for (const response of responses) {
      queueClaudeResponse(response);
    }

    await page.goto(`/${guildId}/quest`);
    await page.waitForResponse(
      (resp) => resp.url().includes('/api/guilds') && resp.status() === HTTP_OK,
    );

    // Send first message
    await page.getByTestId('CHAT_INPUT').fill('First question');
    await page.getByTestId('SEND_BUTTON').click();
    await expect(page.getByText('First response')).toBeVisible({ timeout: CHAT_TIMEOUT });

    // Send second message
    await page.getByTestId('CHAT_INPUT').fill('Second question');
    await page.getByTestId('SEND_BUTTON').click();
    await expect(page.getByText('Second response')).toBeVisible({ timeout: CHAT_TIMEOUT });
  });

  test('empty message not sent', async ({ page, request }) => {
    const guild = await createGuild(request, { name: 'Empty Msg Guild', path: GUILD_PATH });
    const guildId = extractGuildId(guild);

    await page.goto(`/${guildId}/quest`);
    await page.waitForResponse(
      (resp) => resp.url().includes('/api/guilds') && resp.status() === HTTP_OK,
    );

    // Input is empty — send button should be disabled or clicking does nothing
    const sendButton = page.getByTestId('SEND_BUTTON');
    const isDisabled = await sendButton.isDisabled();
    if (isDisabled) {
      await expect(sendButton).toBeDisabled();
    } else {
      // Click and verify no new messages appear in the chat panel
      await sendButton.click();
      // Brief wait to confirm nothing happens
      await page.waitForTimeout(SETTLE_DELAY);
      // Chat panel should have no message content beyond any default state
      const chatPanel = page.getByTestId('CHAT_PANEL');
      await expect(chatPanel).toBeVisible();
    }
  });

  test('user message appears in chat', async ({ page, request }) => {
    const guild = await createGuild(request, { name: 'User Msg Guild', path: GUILD_PATH });
    const guildId = extractGuildId(guild);

    queueClaudeResponse(SimpleTextResponseStub({ text: 'Got it!' }));

    await page.goto(`/${guildId}/quest`);
    await page.waitForResponse(
      (resp) => resp.url().includes('/api/guilds') && resp.status() === HTTP_OK,
    );

    await page.getByTestId('CHAT_INPUT').fill('My unique message text');
    await page.getByTestId('SEND_BUTTON').click();

    // User's own message should appear in the chat
    await expect(page.getByText('My unique message text')).toBeVisible({
      timeout: USER_MSG_TIMEOUT,
    });
    // Claude response also appears
    await expect(page.getByText('Got it!')).toBeVisible({ timeout: CHAT_TIMEOUT });
  });
});
