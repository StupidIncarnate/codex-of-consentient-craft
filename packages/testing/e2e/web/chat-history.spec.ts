import { test, expect, wireHarnessLifecycle } from '@dungeonmaster/testing/e2e';
import {
  claudeMockHarness,
  SimpleTextResponseStub,
  ResumeResponseStub,
} from '../../test/harnesses/claude-mock/claude-mock.harness';
import { environmentHarness } from '../../test/harnesses/environment/environment.harness';
import { guildHarness } from '../../test/harnesses/guild/guild.harness';

const GUILD_PATH = '/tmp/dm-e2e-chat-history';
const HTTP_OK = 200;
const CHAT_TIMEOUT = 5_000;

const claudeMock = claudeMockHarness({ guildPath: GUILD_PATH });
wireHarnessLifecycle({ harness: claudeMock, testObj: test });
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

test.describe('Chat History & Sessions', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
  });

  test('EDGE: chat response persists after page refresh', async ({ page, request }) => {
    const guild = await guildHarness({ request }).createGuild({
      name: 'History Guild',
      path: GUILD_PATH,
    });
    const guilds = guildHarness({ request });
    const guildId = guilds.extractGuildId({ guild });

    claudeMock.queueResponse({ response: SimpleTextResponseStub({ text: 'Persistent response' }) });

    await page.goto(`/${guildId}/quest`);
    await page.waitForResponse(
      (resp) => resp.url().includes('/api/guilds') && resp.status() === HTTP_OK,
    );

    await page.getByTestId('CHAT_INPUT').fill('Remember this');
    await page.getByTestId('SEND_BUTTON').click();

    // Wait for URL to update with quest ID (navigate happens after new quest creation).
    // This must come BEFORE asserting text: the new-quest flow returns the questId
    // immediately when the CLI spawns (before it finishes writing the JSONL). The
    // browser navigates to /:guildSlug/quest/:questId, which triggers subscribe-quest.
    // subscribe-quest replay reads the JSONL — which is complete by this point because
    // the fake CLI has had ~600ms+ (WS connect latency) to write the file.
    await page.waitForURL(/\/quest\/[0-9a-f]/u, { timeout: CHAT_TIMEOUT });

    // Wait for response to appear (loaded via subscribe-quest replay from JSONL)
    await expect(page.getByText('Persistent response')).toBeVisible({ timeout: CHAT_TIMEOUT });

    // Refresh the page; URL is now the stable quest URL so history loads via subscribe-quest replay
    await page.reload();
    await page.waitForResponse(
      (resp) => resp.url().includes('/api/guilds') && resp.status() === HTTP_OK,
    );

    // Response should still be visible (loaded from history via JSONL file)
    await expect(page.getByText('Persistent response')).toBeVisible({ timeout: CHAT_TIMEOUT });
  });

  test('EDGE: second message in session resumes', async ({ page, request }) => {
    const guild = await guildHarness({ request }).createGuild({
      name: 'Resume Guild',
      path: GUILD_PATH,
    });
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
