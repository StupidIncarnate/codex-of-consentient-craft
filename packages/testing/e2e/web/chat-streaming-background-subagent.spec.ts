import { test, expect, wireHarnessLifecycle } from '@dungeonmaster/testing/e2e';
import { AssistantTextStreamLineStub } from '@dungeonmaster/shared/contracts';

import { claudeMockHarness } from '../../test/harnesses/claude-mock/claude-mock.harness';
import { environmentHarness } from '../../test/harnesses/environment/environment.harness';
import { guildHarness } from '../../test/harnesses/guild/guild.harness';
import { questHarness } from '../../test/harnesses/quest/quest.harness';
import { sessionHarness } from '../../test/harnesses/session/session.harness';

const GUILD_PATH = '/tmp/dm-e2e-streaming-bg-subagent';
const HTTP_OK = 200;
const CHAT_TIMEOUT = 10_000;

const claudeMock = claudeMockHarness({ guildPath: GUILD_PATH });
wireHarnessLifecycle({ harness: claudeMock, testObj: test });
const sessions = sessionHarness({ guildPath: GUILD_PATH });
wireHarnessLifecycle({ harness: sessions, testObj: test });
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

test.describe('Streaming sub-agent grouping (run_in_background — agent JSONL grows past parent CLI exit)', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
    sessions.cleanSessionDirectory();
  });

  test('VALID: {Task tool_result with isAsync + status: async_launched, sub-agent JSONL appended after parent end_turn} => sub-agent chain shows the late-arriving entry', async ({
    page,
    request,
  }) => {
    const guild = await guildHarness({ request }).createGuild({
      name: 'Streaming BG Subagent Guild',
      path: GUILD_PATH,
    });
    const guildId = guildHarness({ request }).extractGuildId({ guild });

    const sessionId = 'e2e-stream-bg-sub-001';
    const agentId = 'bgsubagentaaaa';
    const taskToolUseId = 'toolu_stream_bg_task_001';
    const INITIAL_MARKER = 'BG_SUBAGENT_INITIAL_MARKER_pre';
    const LATE_MARKER = 'BG_SUBAGENT_LATE_MARKER_post';

    // Pre-create the main session JSONL so the session URL resolves.
    sessions.createSessionFile({ sessionId, userMessage: 'Launch background agent' });

    // Pre-seed the sub-agent JSONL with one entry — this mirrors the small slice of
    // sub-agent activity Claude CLI has already written by the time the parent receives
    // the `async_launched` tool_result on stdout. The streaming sub-agent tail's
    // `initialDrain` is expected to deliver this line before parent CLI exit.
    sessions.createSubagentTailOnly({ sessionId, agentId, assistantText: INITIAL_MARKER });

    // Bind the session to a quest so the workspace renders the live chat view.
    const quests = questHarness({ request });
    const created = await quests.createQuest({
      guildId,
      title: 'BG Subagent Streaming Quest',
      userRequest: 'Stream a backgrounded sub-agent',
    });
    quests.writeQuestFile({
      questId: String(created.questId),
      questFolder: created.questFolder,
      questFilePath: created.filePath,
      status: 'review_flows',
      workItems: [
        { id: 'e2e00000-0000-4000-8000-000000000010', role: 'chaoswhisperer', sessionId },
      ],
    });

    // Drive the parent stream as Claude CLI does for `run_in_background: true`:
    //   - assistant emits an Agent tool_use,
    //   - user tool_result returns IMMEDIATELY with `isAsync: true` and
    //     `status: 'async_launched'` (sub-agent is still running),
    //   - parent assistant ends its turn ("I'll be notified..."), CLI exits.
    // The sub-agent JSONL keeps growing on disk after this exit; the stream wire
    // must keep delivering its entries, otherwise the chain renders `(0 entries)`.
    claudeMock.queueResponse({
      response: {
        sessionId,
        lines: [
          JSON.stringify({
            type: 'system',
            subtype: 'init',
            session_id: sessionId,
            model: 'claude-opus-4-7',
          }),
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
                    description: 'Background sub-agent does MCP calls',
                    subagent_type: 'general-purpose',
                    prompt: 'Do the thing in the background',
                  },
                },
              ],
            },
          }),
          JSON.stringify({
            type: 'user',
            parent_tool_use_id: null,
            session_id: sessionId,
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
              agentId,
              description: 'Background sub-agent does MCP calls',
              prompt: 'Do the thing in the background',
            },
          }),
          JSON.stringify(
            AssistantTextStreamLineStub({
              message: {
                role: 'assistant',
                content: [
                  {
                    type: 'text',
                    text: "Launched. I'll be notified when it completes.",
                  },
                ],
              },
            }),
          ),
          JSON.stringify({
            type: 'result',
            subtype: 'success',
            session_id: sessionId,
            is_error: false,
          }),
        ],
      },
    });

    await page.goto(`/${guildId}/quest/${created.questId}`);
    await page.waitForResponse(
      (resp) => resp.url().includes('/api/guilds') && resp.status() === HTTP_OK,
    );

    await page.getByTestId('CHAT_INPUT').fill('Stream a backgrounded sub-agent');
    await page.getByTestId('SEND_BUTTON').click();

    // The parent's "Launched..." text marks parent end_turn. After this is on screen,
    // the parent CLI has exited and `chat-start-responder.onComplete` has run. With
    // the lifecycle fix, sub-agent tails MUST stay alive past this point.
    await expect(page.getByText("Launched. I'll be notified when it completes.")).toBeVisible({
      timeout: CHAT_TIMEOUT,
    });

    // The pre-seeded INITIAL_MARKER is expected to have been drained by initialDrain
    // before onComplete; both before AND after the fix this should already render.
    const chainHeader = page.getByTestId('SUBAGENT_CHAIN_HEADER');

    await expect(chainHeader).toBeVisible({ timeout: CHAT_TIMEOUT });
    await expect(chainHeader).toContainText('Background sub-agent does MCP calls', {
      timeout: CHAT_TIMEOUT,
    });

    // NOW append a LATE line to the sub-agent JSONL — simulating Claude CLI writing
    // the background agent's later activity after the parent CLI has already exited.
    // Under the buggy lifecycle (handle.stop() called in onComplete), the watcher is
    // dead and this line never reaches the wire. With the fix, the watcher stays
    // alive and the LATE_MARKER reaches the chain.
    sessions.appendSubagentLine({
      sessionId,
      agentId,
      line: JSON.stringify(
        AssistantTextStreamLineStub({
          message: {
            role: 'assistant',
            content: [{ type: 'text', text: LATE_MARKER }],
            usage: { input_tokens: 12, output_tokens: 4 },
          },
        }),
      ),
    });

    const chainScope = page.getByTestId('SUBAGENT_CHAIN');

    // Sub-agent chain default tail-window pins the most-recent text anchor (LATE_MARKER)
    // and hides earlier entries. Click "Show N earlier" to reveal INITIAL_MARKER too.
    await chainScope.getByTestId('SUBAGENT_CHAIN_SHOW_EARLIER_TOGGLE').click();

    await expect(chainScope.getByText(LATE_MARKER).first()).toBeVisible({
      timeout: CHAT_TIMEOUT,
    });
    await expect(chainScope.getByText(INITIAL_MARKER).first()).toBeVisible({
      timeout: CHAT_TIMEOUT,
    });
    await expect(chainHeader).toContainText('2 entries', { timeout: CHAT_TIMEOUT });
  });
});
