import { test, expect, wireHarnessLifecycle } from '@dungeonmaster/testing/e2e';
import { AssistantTextStreamLineStub } from '@dungeonmaster/shared/contracts';

import { claudeMockHarness } from '../../test/harnesses/claude-mock/claude-mock.harness';
import { environmentHarness } from '../../test/harnesses/environment/environment.harness';
import { guildHarness } from '../../test/harnesses/guild/guild.harness';
import { sessionHarness } from '../../test/harnesses/session/session.harness';

// Mirrors the bug the user repro'd in the live UI: a brand-new chat (no pre-existing
// session, no quest workItem.sessionId) where the very first turn launches a
// `run_in_background: true` Task. Captures TWO regressions that combine to render
// `(0 entries)` in the SUB-AGENT chain:
//
//   (a) chat-spawn-broker only invokes `onAgentDetected` when its `sessionId` parameter
//       is truthy — but on a new chat that param is undefined; the chat's session_id
//       only arrives later via Claude CLI's `system/init` line. So the `agent-detected`
//       output the processor emits is silently dropped, the sub-agent tail is never
//       started, and the chain stays empty for the full chat lifetime.
//
//   (b) Even if (a) is fixed, the sub-agent JSONL doesn't exist yet at the moment
//       Claude CLI emits the `async_launched` tool_result on stdout — the file only
//       gets created milliseconds later as Claude starts writing it. `fs.watch` on a
//       not-yet-existent path throws ENOENT synchronously, killing the broker before
//       anything can be tailed.
//
// This spec exercises both: it does NOT pre-seed the session JSONL, does NOT pre-seed
// the sub-agent JSONL, and assigns the chat workItem with NO sessionId. After streaming
// has started and parent CLI has end-turned, the test appends a marker line directly to
// the sub-agent JSONL — simulating Claude CLI continuing to write its background agent
// JSONL after its synthetic tool_result returned. Under the buggy code paths, that
// marker never reaches the chain. With both fixes, it does.

const GUILD_PATH = '/tmp/dm-e2e-streaming-new-chat-bg';
const HTTP_OK = 200;
const CHAT_TIMEOUT = 15_000;

const claudeMock = claudeMockHarness({ guildPath: GUILD_PATH });
wireHarnessLifecycle({ harness: claudeMock, testObj: test });
const sessions = sessionHarness({ guildPath: GUILD_PATH });
wireHarnessLifecycle({ harness: sessions, testObj: test });
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

test.describe('Streaming sub-agent grouping (NEW chat: sessionId from system/init, sub-agent JSONL absent at agent-detected time)', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
    sessions.cleanSessionDirectory();
  });

  test('VALID: {new chat, system/init session_id, run_in_background tool_result with isAsync, sub-agent JSONL appended after streaming starts} => marker reaches the SUB-AGENT chain', async ({
    page,
    request,
  }) => {
    const guild = await guildHarness({ request }).createGuild({
      name: 'Streaming New-Chat BG Subagent Guild',
      path: GUILD_PATH,
    });
    const guildId = guildHarness({ request }).extractGuildId({ guild });

    // The sessionId Claude mock will emit on its `system/init` line. The chat-start
    // endpoint is called WITHOUT a sessionId; it propagates as `undefined` to
    // chatSpawnBroker; sessionId$ resolves once system/init is parsed. This is the
    // exact shape of a fresh chat in production.
    const newSessionId = 'e2e-bgnewchat-001';
    const realAgentId = 'bgnewagentid';
    const taskToolUseId = 'toolu_bg_newchat_task_001';
    const LATE_MARKER = 'BG_NEWCHAT_LATE_MARKER_after_endturn';

    // No pre-created quest — the new-chat path is what we're exercising. The browser
    // navigates to `/codex/quest/` (no questId), sends a message, and the orchestrator's
    // chat-spawn-broker creates a fresh quest via questUserAddBroker. The chat-output
    // events ship for that new quest; the binding subscribes after the URL navigates.

    claudeMock.queueResponse({
      response: {
        sessionId: newSessionId,
        lines: [
          // system/init carries the session_id Claude CLI just allocated. chatSpawnBroker
          // must pick this up and use it for `agent-detected` correlation downstream.
          JSON.stringify({
            type: 'system',
            subtype: 'init',
            session_id: newSessionId,
            model: 'claude-opus-4-7',
          }),
          // assistant emits a `run_in_background` Agent tool_use.
          JSON.stringify({
            type: 'assistant',
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use',
                  id: taskToolUseId,
                  name: 'Agent',
                  input: {
                    description: 'Run BG fix verify command',
                    subagent_type: 'general-purpose',
                    prompt: 'Echo BG_NEWCHAT marker',
                    run_in_background: true,
                  },
                },
              ],
            },
          }),
          // user tool_result with `isAsync: true, status: async_launched, agentId`.
          // The orchestrator's processor emits `agent-detected` from this — but on a
          // new chat the chat-spawn-broker's `if (sessionId)` guard skips invoking
          // onAgentDetected because the resume-only sessionId param is undefined.
          JSON.stringify({
            type: 'user',
            parent_tool_use_id: null,
            session_id: newSessionId,
            message: {
              role: 'user',
              content: [
                {
                  type: 'tool_result',
                  tool_use_id: taskToolUseId,
                  content: 'Async agent launched successfully.',
                },
              ],
            },
            tool_use_result: {
              isAsync: true,
              status: 'async_launched',
              agentId: realAgentId,
              description: 'Run BG fix verify command',
              prompt: 'Echo BG_NEWCHAT marker',
            },
          }),
          // parent end-turn text. The CLI exits at this point; sub-agent JSONL is
          // written by Claude CLI separately (and concurrently) but doesn't exist yet
          // at the moment chat-subagent-tail-broker would call fs.watch on it.
          JSON.stringify(
            AssistantTextStreamLineStub({
              message: {
                role: 'assistant',
                content: [
                  {
                    type: 'text',
                    text: "Background agent launched. I'll be notified when it completes.",
                  },
                ],
              },
            }),
          ),
          JSON.stringify({
            type: 'result',
            subtype: 'success',
            session_id: newSessionId,
            is_error: false,
          }),
        ],
      },
    });

    await page.goto(`/${guildId}/quest/`);
    await page.waitForResponse(
      (resp) => resp.url().includes('/api/guilds') && resp.status() === HTTP_OK,
    );

    await page.getByTestId('CHAT_INPUT').fill('Stream a backgrounded sub-agent on a fresh chat');
    await page.getByTestId('SEND_BUTTON').click();

    // The orchestrator creates a fresh quest as the chat starts — wait for the URL
    // to settle on the new questId so the binding has subscribed before we assert
    // anything against the chat panel.
    await page.waitForURL(/\/quest\/[0-9a-f-]{36}/u, { timeout: CHAT_TIMEOUT });

    // Wait until the parent end-turn text is on screen — meaning streaming is in flight
    // and the orchestrator has already processed the `async_launched` tool_result and
    // (under the buggy paths) tried/failed to start the sub-agent tail.
    await expect(
      page.getByText("Background agent launched. I'll be notified when it completes."),
    ).toBeVisible({ timeout: CHAT_TIMEOUT });

    // The chain header itself should render (the Agent tool_use was on stdout, so the
    // Task ChatEntry made it through). Confirms the test setup before we move to the
    // entry-count assertion below.
    const chainHeader = page.getByTestId('SUBAGENT_CHAIN_HEADER');

    await expect(chainHeader).toBeVisible({ timeout: CHAT_TIMEOUT });
    await expect(chainHeader).toContainText('Run BG fix verify command', {
      timeout: CHAT_TIMEOUT,
    });

    // NOW append the late marker to the sub-agent JSONL. Simulates Claude CLI's
    // background agent finishing its work and writing its final entry, AFTER the
    // parent CLI has already end-turned and the orchestrator's onComplete has fired.
    // Under the buggy lifecycle + ENOENT race + missing-sessionId path, this never
    // reaches the wire. With the fixes applied it is delivered to the chain.
    sessions.appendSubagentLine({
      sessionId: newSessionId,
      agentId: realAgentId,
      line: JSON.stringify(
        AssistantTextStreamLineStub({
          message: {
            role: 'assistant',
            content: [{ type: 'text', text: LATE_MARKER }],
            usage: { input_tokens: 14, output_tokens: 6 },
          },
        }),
      ),
    });

    const chainScope = page.getByTestId('SUBAGENT_CHAIN');

    await expect(chainScope.getByText(LATE_MARKER).first()).toBeVisible({
      timeout: CHAT_TIMEOUT,
    });
    await expect(chainHeader).toContainText('1 entries', { timeout: CHAT_TIMEOUT });
  });
});
