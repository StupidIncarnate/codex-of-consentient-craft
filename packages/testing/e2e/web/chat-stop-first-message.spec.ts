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

const GUILD_PATH = '/tmp/dm-e2e-chat-stop-first-message';
const HTTP_OK = 200;
const URL_TIMEOUT = 5_000;
const STOP_TIMEOUT = 5_000;
// Long delay between lines so the assistant text is held back long enough that
// (a) the e2e click has time to STOP before any text appears in the new-chat
// surface, and (b) the assertion that the late text never appeared is meaningful
// (not a race against natural completion).
const SLOW_DELAY_MS = 6_000;

const claudeMock = claudeMockHarness({ guildPath: GUILD_PATH });
wireHarnessLifecycle({ harness: claudeMock, testObj: test });
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

test.describe('Chat STOP on first message (new-chat surface)', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
  });

  test('VALID: {click STOP immediately after first SEND on new chat} => streaming halts and assistant text never appears', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const guild = await guilds.createGuild({
      name: 'Stop First Guild',
      path: GUILD_PATH,
    });
    const guildId = guilds.extractGuildId({ guild });

    // Slow response: system_init lands quickly to keep the CLI process alive,
    // then a long delay before any visible assistant text. STOP must kill the
    // process before that text emits.
    claudeMock.queueResponse({
      response: {
        sessionId: SessionIdStub({
          value: 'e2e-session-00000000-0000-0000-0000-000000000099',
        }),
        delayMs: TimeoutMsStub({ value: SLOW_DELAY_MS }),
        lines: [
          streamLineToJsonLineTransformer({ streamLine: SystemInitStreamLineStub() }),
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

    // Land on the new-chat surface (NO questId in URL). This is where the bug
    // lives — the layer widget renders the new-chat branch which historically
    // did not wire onStopChat through to the binding's stopChat.
    await page.goto(`/${guildId}/quest`);
    await page.waitForResponse(
      (resp) => resp.url().includes('/api/guilds') && resp.status() === HTTP_OK,
    );

    await page.getByTestId('CHAT_INPUT').fill('Begin slow work');
    await page.getByTestId('SEND_BUTTON').click();

    // Wait for replace-navigate to land on /quest/:questId — this confirms the
    // first-message flow created the quest and the binding now has a questId
    // for stopChat to act on.
    await page.waitForURL(/\/quest\/[0-9a-f]/u, { timeout: URL_TIMEOUT });

    // STOP_BUTTON renders because submitting=true (or chat-output's system_init
    // flipped isStreaming). Click it RIGHT NOW — before any visible text emits,
    // which is the user-reported scenario.
    const stopButton = page.getByTestId('STOP_BUTTON');

    await expect(stopButton).toBeVisible({ timeout: STOP_TIMEOUT });

    await stopButton.click();

    // After STOP, the input must return to the SEND state. This is the
    // user-visible signal that the streaming was actually halted.
    await expect(page.getByTestId('SEND_BUTTON')).toBeVisible({ timeout: STOP_TIMEOUT });
    await expect(page.getByTestId('STOP_BUTTON')).not.toBeVisible();

    // The held-back assistant text must NEVER appear — the process was killed
    // before it could emit. Without the fix, the noop onStopChat lets the
    // process keep running and this text shows up after SLOW_DELAY_MS.
    await expect(page.getByText('This text should never appear')).not.toBeVisible();
  });
});
