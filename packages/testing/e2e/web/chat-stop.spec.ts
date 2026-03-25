import { test, expect } from '@dungeonmaster/testing/e2e';
import { wireHarnessLifecycle } from './fixtures/harness-wire';
import { claudeMockHarness } from '../../test/harnesses/claude-mock/claude-mock.harness';
import { environmentHarness } from '../../test/harnesses/environment/environment.harness';
import { cleanGuilds, createGuild } from './fixtures/test-helpers';
import { guildHarness } from '../../test/harnesses/guild/guild.harness';
import {
  SessionInitLineStub,
  TextLineStub,
  ResultLineStub,
} from './harness/claude-mock/stream-json-line-stubs';

const GUILD_PATH = '/tmp/dm-e2e-chat-stop';
const HTTP_OK = 200;
const CHAT_TIMEOUT = 5_000;
const SLOW_DELAY_MS = 3000;

const claudeMock = claudeMockHarness();
wireHarnessLifecycle({ harness: claudeMock, testObj: test });
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

test.describe('Chat Stop', () => {
  test.beforeEach(async ({ request }) => {
    await cleanGuilds({ request });
  });

  test('stop button kills running chat process', async ({ page, request }) => {
    const guild = await createGuild({ request, name: 'Stop Guild', path: GUILD_PATH });
    const guilds = guildHarness({ request });
    const guildId = guilds.extractGuildId({ guild });

    // Queue a slow response — 3s delay between each line so the process stays alive
    claudeMock.queueResponse({
      response: {
        sessionId: 'e2e-session-00000000-0000-0000-0000-000000000000',
        delayMs: SLOW_DELAY_MS,
        lines: [
          SessionInitLineStub(),
          TextLineStub({ text: 'Starting slow work...' }),
          TextLineStub({ text: 'This text should never appear' }),
          ResultLineStub(),
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
