import { test, expect, wireHarnessLifecycle } from '@dungeonmaster/testing/e2e';
import { claudeMockHarness } from '../../test/harnesses/claude-mock/claude-mock.harness';
import { environmentHarness } from '../../test/harnesses/environment/environment.harness';
import { guildHarness } from '../../test/harnesses/guild/guild.harness';
import {
  SessionIdStub,
  TimeoutMsStub,
  SystemInitStreamLineStub,
  AssistantTextStreamLineStub,
  ResultStreamLineStub,
} from '@dungeonmaster/shared/contracts';
import { streamLineToJsonLineTransformer } from '@dungeonmaster/shared/transformers';

const GUILD_PATH = '/tmp/dm-e2e-chat-stop';
const HTTP_OK = 200;
const CHAT_TIMEOUT = 5_000;
const SLOW_DELAY_MS = 3000;

const claudeMock = claudeMockHarness();
wireHarnessLifecycle({ harness: claudeMock, testObj: test });
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

test.describe('Chat Stop', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
  });

  test('stop button kills running chat process', async ({ page, request }) => {
    const guild = await guildHarness({ request }).createGuild({
      name: 'Stop Guild',
      path: GUILD_PATH,
    });
    const guilds = guildHarness({ request });
    const guildId = guilds.extractGuildId({ guild });

    // Queue a slow response — 3s delay between each line so the process stays alive
    claudeMock.queueResponse({
      response: {
        sessionId: SessionIdStub({ value: 'e2e-session-00000000-0000-0000-0000-000000000000' }),
        delayMs: TimeoutMsStub({ value: SLOW_DELAY_MS }),
        lines: [
          streamLineToJsonLineTransformer({ streamLine: SystemInitStreamLineStub() }),
          streamLineToJsonLineTransformer({
            streamLine: AssistantTextStreamLineStub({
              message: {
                role: 'assistant',
                content: [{ type: 'text', text: 'Starting slow work...' }],
              },
            }),
          }),
          streamLineToJsonLineTransformer({
            streamLine: AssistantTextStreamLineStub({
              message: {
                role: 'assistant',
                content: [{ type: 'text', text: 'This text should never appear' }],
              },
            }),
          }),
          streamLineToJsonLineTransformer({ streamLine: ResultStreamLineStub() }),
        ],
      },
    });

    await page.goto(`/${guildId}/quest`);
    await page.waitForResponse(
      (resp) => resp.url().includes('/api/guilds') && resp.status() === HTTP_OK,
    );

    await page.getByTestId('CHAT_INPUT').fill('Do something slow');
    await page.getByTestId('SEND_BUTTON').click();

    // Wait for the first text line to appear — confirms streaming is active
    await expect(page.getByText('Starting slow work...')).toBeVisible({ timeout: CHAT_TIMEOUT });

    // Stop button should be visible while streaming
    const stopButton = page.getByTestId('STOP_BUTTON');

    await expect(stopButton).toBeVisible();

    // Click stop
    await stopButton.click();

    // Send button should reappear (streaming stopped)
    await expect(page.getByTestId('SEND_BUTTON')).toBeVisible({ timeout: CHAT_TIMEOUT });

    // The late text should NOT have appeared — process was killed before it was emitted
    await expect(page.getByText('This text should never appear')).not.toBeVisible();
  });
});
