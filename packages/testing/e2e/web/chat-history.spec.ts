import { test, expect } from '@dungeonmaster/testing/e2e';
import { wireHarnessLifecycle } from './fixtures/harness-wire';
import { claudeMockHarness } from '../../test/harnesses/claude-mock/claude-mock.harness';
import { environmentHarness } from '../../test/harnesses/environment/environment.harness';
import { guildHarness } from '../../test/harnesses/guild/guild.harness';
import {
  cleanGuilds,
  createGuild,
  SimpleTextResponseStub,
  ResumeResponseStub,
} from './fixtures/test-helpers';

const GUILD_PATH = '/tmp/dm-e2e-chat-history';
const HTTP_OK = 200;
const CHAT_TIMEOUT = 5_000;

const claudeMock = claudeMockHarness();
wireHarnessLifecycle({ harness: claudeMock, testObj: test });
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

test.describe('Chat History & Sessions', () => {
  test.beforeEach(async ({ request }) => {
    await cleanGuilds({ request });
  });

  test('chat response persists after page refresh', async ({ page, request }) => {
    const guild = await createGuild({ request, name: 'History Guild', path: GUILD_PATH });
    const guilds = guildHarness({ request });
    const guildId = guilds.extractGuildId({ guild });

    claudeMock.queueResponse({ response: SimpleTextResponseStub({ text: 'Persistent response' }) });

    await page.goto(`/${guildId}/quest`);
    await page.waitForResponse(
      (resp) => resp.url().includes('/api/guilds') && resp.status() === HTTP_OK,
    );

    await page.getByTestId('CHAT_INPUT').fill('Remember this');
    await page.getByTestId('SEND_BUTTON').click();

    // Wait for response to appear
    await expect(page.getByText('Persistent response')).toBeVisible({ timeout: CHAT_TIMEOUT });

    // Wait for URL to update with session ID (happens after streaming completes)
    await page.waitForURL(/\/session\//u, { timeout: CHAT_TIMEOUT });

    // Refresh the page (use reload to preserve the session URL that was set after streaming)
    await page.reload();
    await page.waitForResponse(
      (resp) => resp.url().includes('/api/guilds') && resp.status() === HTTP_OK,
    );

    // Response should still be visible (loaded from history via JSONL file)
    await expect(page.getByText('Persistent response')).toBeVisible({ timeout: CHAT_TIMEOUT });
  });

  test('second message in session resumes', async ({ page, request }) => {
    const guild = await createGuild({ request, name: 'Resume Guild', path: GUILD_PATH });
    const guilds = guildHarness({ request });
    const guildId = guilds.extractGuildId({ guild });

    // Queue first response (full session init)
    claudeMock.queueResponse({ response: SimpleTextResponseStub({ text: 'First reply' }) });

    await page.goto(`/${guildId}/quest`);
    await page.waitForResponse(
      (resp) => resp.url().includes('/api/guilds') && resp.status() === HTTP_OK,
    );

    // Send first message
    await page.getByTestId('CHAT_INPUT').fill('First message');
    await page.getByTestId('SEND_BUTTON').click();

    await expect(page.getByText('First reply')).toBeVisible({ timeout: CHAT_TIMEOUT });

    // Queue second response (resume — no init)
    claudeMock.queueResponse({ response: ResumeResponseStub({ text: 'Second reply' }) });

    // Send second message
    await page.getByTestId('CHAT_INPUT').fill('Second message');
    await page.getByTestId('SEND_BUTTON').click();

    await expect(page.getByText('Second reply')).toBeVisible({ timeout: CHAT_TIMEOUT });
  });
});
