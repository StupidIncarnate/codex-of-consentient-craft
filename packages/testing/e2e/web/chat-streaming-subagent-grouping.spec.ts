import { test, expect, wireHarnessLifecycle } from '@dungeonmaster/testing/e2e';
import { AssistantTextStreamLineStub } from '@dungeonmaster/shared/contracts';

import { claudeMockHarness } from '../../test/harnesses/claude-mock/claude-mock.harness';
import { environmentHarness } from '../../test/harnesses/environment/environment.harness';
import { guildHarness } from '../../test/harnesses/guild/guild.harness';
import { sessionHarness } from '../../test/harnesses/session/session.harness';

const GUILD_PATH = '/tmp/dm-e2e-streaming-subagent';
const HTTP_OK = 200;
const CHAT_TIMEOUT = 10_000;

const claudeMock = claudeMockHarness();
wireHarnessLifecycle({ harness: claudeMock, testObj: test });
const sessions = sessionHarness({ guildPath: GUILD_PATH });
wireHarnessLifecycle({ harness: sessions, testObj: test });
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

test.describe('Streaming sub-agent grouping (stdout snake_case tool_use_result)', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
    sessions.cleanSessionDirectory();
  });

  test('VALID: {streamed Agent tool_use followed by user tool_result with tool_use_result.agentId (snake_case)} => sub-agent chain groups its sub-agent tail entries', async ({
    page,
    request,
  }) => {
    const guild = await guildHarness({ request }).createGuild({
      name: 'Streaming Subagent Guild',
      path: GUILD_PATH,
    });
    const guildId = guildHarness({ request }).extractGuildId({ guild });

    const sessionId = 'e2e-stream-sub-001';
    const agentId = 'streamsubagenta';
    const taskToolUseId = 'toolu_stream_task_001';
    const SUBAGENT_MARKER = 'SUBAGENT_INNER_MARKER_xyz';

    // Pre-create the existing main session JSONL so the session URL resolves.
    sessions.createSessionFile({ sessionId, userMessage: 'Kick off test' });

    // Pre-create the sub-agent JSONL that chatSubagentTailBroker will read ONCE the
    // foreground Agent tool_use is correlated and the tail starts.
    sessions.createSubagentTailOnly({ sessionId, agentId, assistantText: SUBAGENT_MARKER });

    // Queue a Claude CLI response that mirrors REAL streaming output: the user
    // tool_result line carries `tool_use_result` (snake_case, as Claude CLI emits on
    // stdout — NOT the `toolUseResult` camelCase found in the JSONL file on disk).
    // This is the exact shape captured from live stdout. The transformer must
    // recognize snake_case to correlate agentId and start the sub-agent tail.
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
                    description: 'Sub-agent does MCP calls',
                    subagent_type: 'general-purpose',
                    prompt: 'Do the thing',
                  },
                },
              ],
            },
          }),
          // The USER tool_result for the Agent tool_use. `tool_use_result.agentId`
          // is the snake_case field Claude CLI writes to stdout stream-json. The
          // transformer currently reads camelCase `toolUseResult` — so without a fix,
          // no patch is emitted, no sub-agent tail starts, and the chain stays empty.
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
                  content: 'Sub-agent complete',
                },
              ],
            },
            tool_use_result: {
              agentId,
              status: 'completed',
              content: [{ type: 'text', text: 'Sub-agent complete' }],
              totalTokens: 100,
              totalDurationMs: 200,
              totalToolUseCount: 1,
            },
          }),
          JSON.stringify(
            AssistantTextStreamLineStub({
              message: {
                role: 'assistant',
                content: [{ type: 'text', text: 'All done' }],
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

    // Navigate to the existing session URL so the next chat message resumes with
    // sessionId — this gates `onAgentDetected` inside chat-spawn-broker, which needs
    // `sessionId` to be defined to wire up the foreground sub-agent tail.
    await page.goto(`/${guildId}/session/${sessionId}`);
    await page.waitForResponse(
      (resp) => resp.url().includes('/api/guilds') && resp.status() === HTTP_OK,
    );

    // Send the chat message that triggers the queued response above.
    await page.getByTestId('CHAT_INPUT').fill('Stream sub-agent via stdout');
    await page.getByTestId('SEND_BUTTON').click();

    // Wait for the streamed parent-level assistant text so we know processing finished.
    await expect(page.getByText('All done')).toBeVisible({ timeout: CHAT_TIMEOUT });

    // The Agent tool_use creates a sub-agent chain group. Without the fix, this
    // group exists but has `agentId = ''` and `entryCount = 0` (no sub-agent entries
    // tagged). With the fix, the patch stamps the real agentId, the sub-agent tail
    // reads agent-{agentId}.jsonl, and the chain inner groups contain the marker.
    const chainHeader = page.getByTestId('SUBAGENT_CHAIN_HEADER');

    await expect(chainHeader).toBeVisible({ timeout: CHAT_TIMEOUT });

    // Sub-agent grouping working: the chain header shows the entries from the
    // subagent tail. Before the snake_case fix it was "(0 entries)"; now both
    // replay-history and live chat surface the marker entry, so the chain shows 2.
    await expect(chainHeader).toContainText('2 entries', { timeout: CHAT_TIMEOUT });

    // Expand and confirm the inner marker text lives inside the chain.
    await chainHeader.click();
    const chainScope = page.getByTestId('SUBAGENT_CHAIN');

    await expect(chainScope.getByText(SUBAGENT_MARKER).first()).toBeVisible({
      timeout: CHAT_TIMEOUT,
    });
  });
});
