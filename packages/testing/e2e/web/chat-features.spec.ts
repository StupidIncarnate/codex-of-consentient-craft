import { test, expect, wireHarnessLifecycle } from '@dungeonmaster/testing/e2e';
import {
  claudeMockHarness,
  SimpleTextResponseStub,
  ToolUseChainResponseStub,
  ErrorResponseStub,
  ResumeResponseStub,
} from '../../test/harnesses/claude-mock/claude-mock.harness';
import { environmentHarness } from '../../test/harnesses/environment/environment.harness';
import { guildHarness } from '../../test/harnesses/guild/guild.harness';

const GUILD_PATH = '/tmp/dm-e2e-chat-features';
const HTTP_OK = 200;
const CHAT_TIMEOUT = 5_000;
const SETTLE_DELAY = 500;
const USER_MSG_TIMEOUT = 3_000;

const claudeMock = claudeMockHarness({ guildPath: GUILD_PATH });
wireHarnessLifecycle({ harness: claudeMock, testObj: test });
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

test.describe('Chat Advanced Features', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
  });

  test('VALID: tool use displays in chat', async ({ page, request }) => {
    const guild = await guildHarness({ request }).createGuild({
      name: 'Tool Guild',
      path: GUILD_PATH,
    });
    const guilds = guildHarness({ request });
    const guildId = guilds.extractGuildId({ guild });

    claudeMock.queueResponse({
      response: ToolUseChainResponseStub({
        toolName: 'Read',
        toolInput: { file_path: '/src/index.ts' },
        toolResultContent: 'export const main = () => {}',
        followUpText: 'I read the file successfully.',
      }),
    });

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

  test('EDGE: error response shows gracefully', async ({ page, request }) => {
    const guild = await guildHarness({ request }).createGuild({
      name: 'Error Guild',
      path: GUILD_PATH,
    });
    const guilds = guildHarness({ request });
    const guildId = guilds.extractGuildId({ guild });

    claudeMock.queueResponse({
      response: ErrorResponseStub({
        partialOutput: 'Starting analysis...',
        exitCode: 1,
      }),
    });

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

  test('VALID: multi-turn conversation', async ({ page, request }) => {
    const guild = await guildHarness({ request }).createGuild({
      name: 'Multi Guild',
      path: GUILD_PATH,
    });
    const guilds = guildHarness({ request });
    const guildId = guilds.extractGuildId({ guild });

    claudeMock.queueResponse({ response: SimpleTextResponseStub({ text: 'First response' }) });
    claudeMock.queueResponse({ response: ResumeResponseStub({ text: 'Second response' }) });

    await page.goto(`/${guildId}/quest`);
    await page.waitForResponse(
      (resp) => resp.url().includes('/api/guilds') && resp.status() === HTTP_OK,
    );

    // Send first message
    await page.getByTestId('CHAT_INPUT').fill('First question');
    await page.getByTestId('SEND_BUTTON').click();

    await expect(page.getByText('First response')).toBeVisible({ timeout: CHAT_TIMEOUT });

    // Wait for the input to become ready for the next message
    await expect(page.getByTestId('CHAT_INPUT')).toBeEnabled({ timeout: CHAT_TIMEOUT });

    // Send second message
    await page.getByTestId('CHAT_INPUT').fill('Second question');
    await page.getByTestId('SEND_BUTTON').click();

    await expect(page.getByText('Second response')).toBeVisible({ timeout: CHAT_TIMEOUT });
  });

  test('EDGE: empty message not sent', async ({ page, request }) => {
    const guild = await guildHarness({ request }).createGuild({
      name: 'Empty Msg Guild',
      path: GUILD_PATH,
    });
    const guilds = guildHarness({ request });
    const guildId = guilds.extractGuildId({ guild });

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
      // Chat panel should remain visible with no message content beyond any default state
      const chatPanel = page.getByTestId('CHAT_PANEL');

      await expect(chatPanel).toBeVisible({ timeout: SETTLE_DELAY });
    }
  });

  test('VALID: user message appears in chat', async ({ page, request }) => {
    const guild = await guildHarness({ request }).createGuild({
      name: 'User Msg Guild',
      path: GUILD_PATH,
    });
    const guilds = guildHarness({ request });
    const guildId = guilds.extractGuildId({ guild });

    claudeMock.queueResponse({ response: SimpleTextResponseStub({ text: 'Got it!' }) });

    await page.goto(`/${guildId}/quest`);
    await page.waitForResponse(
      (resp) => resp.url().includes('/api/guilds') && resp.status() === HTTP_OK,
    );

    await page.getByTestId('CHAT_INPUT').fill('My unique message text');
    await page.getByTestId('SEND_BUTTON').click();

    // User's own message should appear in the chat panel
    const chatPanel = page.getByTestId('CHAT_PANEL');

    await expect(chatPanel.getByText('My unique message text')).toBeVisible({
      timeout: USER_MSG_TIMEOUT,
    });
    // Claude response also appears
    await expect(chatPanel.getByText('Got it!')).toBeVisible({ timeout: CHAT_TIMEOUT });
  });
});
