import { test, expect } from '@dungeonmaster/testing/e2e';
import { wireHarnessLifecycle } from './fixtures/harness-wire';
import { claudeMockHarness } from '../../test/harnesses/claude-mock/claude-mock.harness';
import { environmentHarness } from '../../test/harnesses/environment/environment.harness';
import { cleanGuilds, createGuild, SimpleTextResponseStub } from './fixtures/test-helpers';
import { guildHarness } from '../../test/harnesses/guild/guild.harness';

const GUILD_PATH = '/tmp/dm-e2e-chat-guild';
const HTTP_OK = 200;
const CHAT_TIMEOUT = 5_000;

const claudeMock = claudeMockHarness();
wireHarnessLifecycle({ harness: claudeMock, testObj: test });
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

test.describe('Chat Smoke', () => {
  test.beforeEach(async ({ request }) => {
    await cleanGuilds({ request });
  });

  test('guild chat sends message and displays Claude response', async ({ page, request }) => {
    const guild = await createGuild({ request, name: 'Chat Guild', path: GUILD_PATH });
    const guilds = guildHarness({ request });
    const guildId = guilds.extractGuildId({ guild });

    claudeMock.queueResponse({
      response: SimpleTextResponseStub({ text: 'I can help with that!' }),
    });

    await page.goto(`/${guildId}/quest`);
    await page.waitForResponse(
      (resp) => resp.url().includes('/api/guilds') && resp.status() === HTTP_OK,
    );

    await page.getByTestId('CHAT_INPUT').fill('Hello Claude');
    await page.getByTestId('SEND_BUTTON').click();

    // User message should appear in the chat panel
    const chatPanel = page.getByTestId('CHAT_PANEL');

    await expect(chatPanel.getByText('Hello Claude')).toBeVisible();

    // Wait for Claude response to appear
    await expect(chatPanel.getByText('I can help with that!')).toBeVisible({
      timeout: CHAT_TIMEOUT,
    });
  });
});
