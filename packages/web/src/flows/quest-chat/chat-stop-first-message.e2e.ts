import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { chatControlHarness } from '../../../test/harnesses/chat-control/chat-control.harness';
import { claudeMockHarness } from '../../../test/harnesses/claude-mock/claude-mock.harness';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import {
  SessionIdStub,
  TimeoutMsStub,
  SystemInitStreamLineStub,
  AssistantTextStreamLineStub,
} from '@dungeonmaster/shared/contracts';
import { streamLineToJsonLineTransformer } from '@dungeonmaster/shared/transformers';

const GUILD_PATH = '/tmp/dm-e2e-chat-stop-first-message';
const HTTP_OK = 200;
const PANEL_TIMEOUT = 8_000;
const BUTTON_TIMEOUT = 1_000;
// Per-line delay in the fake CLI. Line 0 (system init) writes immediately; every line after it is
// held far past the assertion window. Nothing may arm the binding's `isStreaming` while this spec
// measures — otherwise STOP reappears for the RIGHT reason at the WRONG time and masks the defect.
const HELD_BACK_DELAY_MS = 20_000;

const claudeMock = claudeMockHarness({ guildPath: GUILD_PATH });
wireHarnessLifecycle({ harness: claudeMock, testObj: test });
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

test.describe('Chat STOP on the first message', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
  });

  test('VALID: {first message creates the quest} => STOP stays visible across the no-quest → live-workspace branch swap', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const chatControl = chatControlHarness({ page });
    const guild = await guilds.createGuild({
      name: 'Stop First Message Guild',
      path: GUILD_PATH,
    });
    const urlSlug = guilds.extractUrlSlug({ guild });

    await chatControl.recordTransitions();

    claudeMock.queueResponse({
      response: {
        sessionId: SessionIdStub({
          value: 'e2e-session-00000000-0000-0000-0000-0000000000a1',
        }),
        delayMs: TimeoutMsStub({ value: HELD_BACK_DELAY_MS }),
        lines: [
          streamLineToJsonLineTransformer({ streamLine: SystemInitStreamLineStub() }),
          streamLineToJsonLineTransformer({
            streamLine: AssistantTextStreamLineStub({
              message: {
                role: 'assistant',
                content: [{ type: 'text', text: 'Held back past the assertion window' }],
              },
            }),
          }),
        ],
      },
    });

    // The new-chat surface: no questId in the URL. The first message creates the quest and
    // replace-navigates to /:slug/quest/:questId, which swaps this widget from its no-quest render
    // branch to the live-workspace one while the agent is still spawning.
    const guildsResponse = page.waitForResponse(
      (resp) => resp.url().includes('/api/guilds') && resp.status() === HTTP_OK,
    );
    await page.goto(`/${urlSlug}/quest`);
    await guildsResponse;

    // The composer only mounts here in `node` orchestrationMode (repo `.dungeonmaster.json`). The
    // picker is node-mode-only, so this fails loudly if the mode ever flips rather than letting the
    // spec pass while measuring the /dumpster-create placeholder instead.
    await expect(page.getByTestId('QUEST_TYPE_PICKER')).toBeVisible({ timeout: PANEL_TIMEOUT });

    await page.getByTestId('CHAT_INPUT').fill('Begin the spec conversation');
    await page.getByTestId('SEND_BUTTON').click();

    await page.waitForURL(/\/quest\/[0-9a-f-]{36}/u, { timeout: PANEL_TIMEOUT });

    // QUEST_SPEC_PANEL mounts only on the live-workspace branch, so its arrival proves the quest
    // object landed and the swap completed. Asserting before this point measures the OLD branch and
    // passes with the bug present.
    await expect(page.getByTestId('QUEST_SPEC_PANEL')).toBeVisible({ timeout: PANEL_TIMEOUT });

    // The regression assertion. No agent output has arrived yet, so the ONLY thing that can hold
    // STOP is the in-flight-send state surviving the branch swap. A third entry means the control
    // reverted to SEND while the turn was still starting.
    const seen = await chatControl.readTransitions();

    expect(seen).toStrictEqual(['SEND_BUTTON', 'STOP_BUTTON']);

    await expect(page.getByTestId('STOP_BUTTON')).toBeVisible({ timeout: BUTTON_TIMEOUT });
    await expect(page.getByTestId('SEND_BUTTON')).not.toBeVisible({ timeout: BUTTON_TIMEOUT });
  });

  test('VALID: {first message whose turn emits no chat entries} => STOP clears when the turn ends, not only when output arrives', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const chatControl = chatControlHarness({ page });
    const guild = await guilds.createGuild({
      name: 'Stop First Message Guild',
      path: GUILD_PATH,
    });
    const urlSlug = guilds.extractUrlSlug({ guild });

    await chatControl.recordTransitions();

    // A turn that produces ZERO chat entries: the CLI emits its init line (so a sessionId stamps),
    // then exits. `chat-complete` is the only signal the running state ever gets. A running state
    // gated on "output arrived" never clears here and the composer shows STOP forever.
    // This case catches disarming too LATE (or never); the case above catches disarming too EARLY.
    // Both wire events fire in this flow, so neither case alone pins which one does the work —
    // that pairing is in use-quest-chat-binding.test.ts.
    claudeMock.queueResponse({
      response: {
        sessionId: SessionIdStub({
          value: 'e2e-session-00000000-0000-0000-0000-0000000000a2',
        }),
        lines: [streamLineToJsonLineTransformer({ streamLine: SystemInitStreamLineStub() })],
      },
    });

    const guildsResponse = page.waitForResponse(
      (resp) => resp.url().includes('/api/guilds') && resp.status() === HTTP_OK,
    );
    await page.goto(`/${urlSlug}/quest`);
    await guildsResponse;

    await expect(page.getByTestId('QUEST_TYPE_PICKER')).toBeVisible({ timeout: PANEL_TIMEOUT });

    await page.getByTestId('CHAT_INPUT').fill('Begin a turn that says nothing');
    await page.getByTestId('SEND_BUTTON').click();

    await page.waitForURL(/\/quest\/[0-9a-f-]{36}/u, { timeout: PANEL_TIMEOUT });
    await expect(page.getByTestId('QUEST_SPEC_PANEL')).toBeVisible({ timeout: PANEL_TIMEOUT });

    // The composer must come back on its own, with no chat entry ever rendered.
    await expect(page.getByTestId('SEND_BUTTON')).toBeVisible({ timeout: PANEL_TIMEOUT });
    await expect(page.getByTestId('STOP_BUTTON')).not.toBeVisible({ timeout: BUTTON_TIMEOUT });

    // …and it must have shown STOP in between. Without this the test would also pass on a build
    // that never armed the running state at all.
    const seen = await chatControl.readTransitions();

    expect(seen).toStrictEqual(['SEND_BUTTON', 'STOP_BUTTON', 'SEND_BUTTON']);
  });
});
