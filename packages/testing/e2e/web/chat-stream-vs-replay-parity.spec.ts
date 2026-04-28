import { test, expect, wireHarnessLifecycle } from '@dungeonmaster/testing/e2e';
import {
  AssistantTaskToolUseStreamLineStub,
  AssistantTextStreamLineStub,
  AssistantToolUseStreamLineStub,
  ResultStreamLineStub,
  SuccessfulToolResultStreamLineStub,
  SystemInitStreamLineStub,
  TaskToolResultStreamLineStub,
} from '@dungeonmaster/shared/contracts';
import {
  claudeMockHarness,
  SimpleTextResponseStub,
} from '../../test/harnesses/claude-mock/claude-mock.harness';
import { environmentHarness } from '../../test/harnesses/environment/environment.harness';
import { guildHarness } from '../../test/harnesses/guild/guild.harness';
import { sessionHarness } from '../../test/harnesses/session/session.harness';

/**
 * Stream-vs-replay parity guard.
 *
 * The chat surface has TWO paths into the same DOM: live WebSocket streaming
 * (`chat-spawn-broker` → `chat-line-process-transformer` → in-memory bus) AND
 * file replay on subscribe-quest (`chat-history-replay-broker` → same processor).
 * Per `packages/orchestrator/CLAUDE.md` they MUST produce identical `ChatEntry`
 * shapes — but historically only one half gets exercised at a time, so a contract
 * tightening (e.g. `stop_reason: null` rejection, or a sub-agent correlation drift)
 * silently breaks streaming while replay keeps working.
 *
 * Each test below sends a message, asserts every facet of the streamed UI:
 *   • exact number of CHAT_MESSAGE elements with their role labels and text content
 *   • exact number of TOOL_ROW elements with their tool names and inputs
 *   • absence of orphan "TOOL RESULT" CHAT_MESSAGE cards (the regression shape from
 *     the screenshots: tool_results unpaired from their tool_use because streaming
 *     dropped the assistant lines)
 *   • tool result content visible inside the row when expanded (for at least one row)
 *
 * It then reloads the page (subscribe-quest replays the JSONL) and asserts the
 * SAME shape, content, counts, and absences. Stream and replay must converge on
 * identical DOM — if they don't, parity is broken.
 *
 * The mock CLI's response queue includes `stop_reason: null` on every assistant
 * line (mirroring real Claude CLI output) — see `claude-queue-response.stub.ts`.
 */

const GUILD_PATH = '/tmp/dm-e2e-stream-vs-replay-parity';
const HTTP_OK = 200;
const CHAT_TIMEOUT = 10_000;
const PARALLEL_TOOL_COUNT = 3;
const ZERO_COUNT = 0;
const ONE_COUNT = 1;

const claudeMock = claudeMockHarness({ guildPath: GUILD_PATH });
wireHarnessLifecycle({ harness: claudeMock, testObj: test });
const sessions = sessionHarness({ guildPath: GUILD_PATH });
wireHarnessLifecycle({ harness: sessions, testObj: test });
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

test.describe('Chat stream vs replay parity', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
  });

  test('VALID: {user message → assistant text reply} => identical CHAT_MESSAGE content and counts after streaming and after reload', async ({
    page,
    request,
  }) => {
    const guild = await guildHarness({ request }).createGuild({
      name: 'Parity Text Guild',
      path: GUILD_PATH,
    });
    const guildId = guildHarness({ request }).extractGuildId({ guild });

    const userText = 'parity-text-user-msg-7891';
    const assistantText = 'parity-text-assistant-reply-2418';

    claudeMock.queueResponse({
      response: SimpleTextResponseStub({ text: assistantText }),
    });

    await page.goto(`/${guildId}/quest`);
    await page.waitForResponse(
      (resp) => resp.url().includes('/api/guilds') && resp.status() === HTTP_OK,
    );

    await page.getByTestId('CHAT_INPUT').fill(userText);
    await page.getByTestId('SEND_BUTTON').click();

    const chatPanel = page.getByTestId('CHAT_PANEL');

    await expect(chatPanel.getByText(assistantText)).toBeVisible({ timeout: CHAT_TIMEOUT });
    await expect(chatPanel.getByText(userText).first()).toBeVisible({ timeout: CHAT_TIMEOUT });
    await expect(
      chatPanel
        .locator('[data-testid="CHAT_MESSAGE"]')
        .filter({ hasText: 'CHAOSWHISPERER' })
        .filter({ hasText: assistantText }),
    ).toHaveCount(ONE_COUNT);
    await expect(chatPanel.locator('[data-testid="TOOL_ROW"]')).toHaveCount(ZERO_COUNT);

    await page.reload();
    await page.waitForResponse(
      (resp) => resp.url().includes('/api/guilds') && resp.status() === HTTP_OK,
    );

    const replayPanel = page.getByTestId('CHAT_PANEL');

    await expect(replayPanel.getByText(assistantText)).toBeVisible({ timeout: CHAT_TIMEOUT });
    await expect(replayPanel.getByText(userText).first()).toBeVisible({ timeout: CHAT_TIMEOUT });
    await expect(
      replayPanel
        .locator('[data-testid="CHAT_MESSAGE"]')
        .filter({ hasText: 'CHAOSWHISPERER' })
        .filter({ hasText: assistantText }),
    ).toHaveCount(ONE_COUNT);
    await expect(replayPanel.locator('[data-testid="TOOL_ROW"]')).toHaveCount(ZERO_COUNT);
  });

  test('VALID: {user message → several parallel tool_uses + tool_results + assistant text} => paired tool rows, no orphan TOOL RESULT cards, identical after streaming and after reload', async ({
    page,
    request,
  }) => {
    const guild = await guildHarness({ request }).createGuild({
      name: 'Parity Multi-Tool Guild',
      path: GUILD_PATH,
    });
    const guildId = guildHarness({ request }).extractGuildId({ guild });

    const sessionId = 'e2e-parity-multitool-001';
    const userText = 'parity-multitool-user-msg-3344';
    const followUpText = 'parity-multitool-assistant-followup-9921';
    const toolName = 'Read';
    const toolUseId1 = 'toolu_parity_p1_aaaaaaaaaa';
    const toolUseId2 = 'toolu_parity_p2_bbbbbbbbbb';
    const toolUseId3 = 'toolu_parity_p3_cccccccccc';
    const filePath1 = '/parity/file-one.ts';
    const filePath2 = '/parity/file-two.ts';
    const filePath3 = '/parity/file-three.ts';
    const resultContent1 = 'parity-tool-result-content-aaa';
    const resultContent2 = 'parity-tool-result-content-bbb';
    const resultContent3 = 'parity-tool-result-content-ccc';

    // Real Claude CLI streams each parallel tool call as its OWN assistant line
    // (one tool_use content item per line), followed by individual user lines
    // for each tool_result. This mirrors what we see in actual session JSONL
    // captures — even though the underlying API message bundles them together,
    // stream-json output emits them separately. This is the exact shape that
    // produced the orphan-TOOL-RESULT bug from the bug-report screenshots —
    // the main agent fires several tool calls, gets back results, and the
    // pairing must hold for every one.
    claudeMock.queueResponse({
      response: {
        sessionId,
        lines: [
          JSON.stringify(SystemInitStreamLineStub({ session_id: sessionId })),
          JSON.stringify(
            AssistantToolUseStreamLineStub({
              message: {
                role: 'assistant',
                stop_reason: null,
                content: [
                  {
                    type: 'tool_use',
                    id: toolUseId1,
                    name: toolName,
                    input: { file_path: filePath1 },
                  },
                ],
              },
            }),
          ),
          JSON.stringify(
            AssistantToolUseStreamLineStub({
              message: {
                role: 'assistant',
                stop_reason: null,
                content: [
                  {
                    type: 'tool_use',
                    id: toolUseId2,
                    name: toolName,
                    input: { file_path: filePath2 },
                  },
                ],
              },
            }),
          ),
          JSON.stringify(
            AssistantToolUseStreamLineStub({
              message: {
                role: 'assistant',
                stop_reason: null,
                content: [
                  {
                    type: 'tool_use',
                    id: toolUseId3,
                    name: toolName,
                    input: { file_path: filePath3 },
                  },
                ],
              },
            }),
          ),
          JSON.stringify(
            SuccessfulToolResultStreamLineStub({
              message: {
                role: 'user',
                content: [
                  { type: 'tool_result', tool_use_id: toolUseId1, content: resultContent1 },
                ],
              },
            }),
          ),
          JSON.stringify(
            SuccessfulToolResultStreamLineStub({
              message: {
                role: 'user',
                content: [
                  { type: 'tool_result', tool_use_id: toolUseId2, content: resultContent2 },
                ],
              },
            }),
          ),
          JSON.stringify(
            SuccessfulToolResultStreamLineStub({
              message: {
                role: 'user',
                content: [
                  { type: 'tool_result', tool_use_id: toolUseId3, content: resultContent3 },
                ],
              },
            }),
          ),
          JSON.stringify(
            AssistantTextStreamLineStub({
              message: {
                role: 'assistant',
                stop_reason: null,
                content: [{ type: 'text', text: followUpText }],
              },
            }),
          ),
          JSON.stringify(ResultStreamLineStub({ session_id: sessionId })),
        ],
      },
    });

    await page.goto(`/${guildId}/quest`);
    await page.waitForResponse(
      (resp) => resp.url().includes('/api/guilds') && resp.status() === HTTP_OK,
    );

    await page.getByTestId('CHAT_INPUT').fill(userText);
    await page.getByTestId('SEND_BUTTON').click();

    const chatPanel = page.getByTestId('CHAT_PANEL');

    await expect(chatPanel.getByText(followUpText)).toBeVisible({ timeout: CHAT_TIMEOUT });

    // STREAMING — exactly N tool rows, each with its tool name + file path
    await expect(chatPanel.locator('[data-testid="TOOL_ROW"]')).toHaveCount(PARALLEL_TOOL_COUNT);
    await expect(
      chatPanel.locator('[data-testid="TOOL_ROW"]').filter({ hasText: filePath1 }),
    ).toHaveCount(ONE_COUNT);
    await expect(
      chatPanel.locator('[data-testid="TOOL_ROW"]').filter({ hasText: filePath2 }),
    ).toHaveCount(ONE_COUNT);
    await expect(
      chatPanel.locator('[data-testid="TOOL_ROW"]').filter({ hasText: filePath3 }),
    ).toHaveCount(ONE_COUNT);

    // The exact regression signature from the screenshots: free-floating "TOOL RESULT"
    // CHAT_MESSAGE cards. When pairing fails, each tool_result falls through to the
    // orphan render branch labelled "TOOL RESULT". A correctly-paired conversation
    // produces ZERO of those.
    await expect(
      chatPanel.locator('[data-testid="CHAT_MESSAGE"]').filter({ hasText: 'TOOL RESULT' }),
    ).toHaveCount(ZERO_COUNT);

    // Each tool row renders TOOL_ROW_STATUS only when its result is paired
    // (success status icon = ✓). Count == PARALLEL_TOOL_COUNT proves the merge
    // transformer paired all three calls.
    await expect(
      chatPanel.locator('[data-testid="TOOL_ROW_STATUS"]', { hasText: '✓' }),
    ).toHaveCount(PARALLEL_TOOL_COUNT);

    // Expand every tool row and assert each one's result content renders
    // inline — this is the load-bearing parity check: it catches the case
    // where a tool_use renders without its tool_result content (the orphan
    // shape from the bug-report screenshots, just disguised). `force: true`
    // bypasses viewport/scroll race conditions in CI where rows past the
    // first can be partially off-screen when the test reaches them.
    const expectToolRowResult = async (
      panel: ReturnType<typeof page.getByTestId>,
      filePath: string,
      resultContent: string,
    ): Promise<void> => {
      const row = panel.locator('[data-testid="TOOL_ROW"]').filter({ hasText: filePath });

      await row.getByTestId('TOOL_ROW_HEADER').click({ force: true });

      await expect(row.getByTestId('TOOL_ROW_RESULT')).toContainText(resultContent, {
        timeout: CHAT_TIMEOUT,
      });
    };

    await expectToolRowResult(chatPanel, filePath1, resultContent1);
    await expectToolRowResult(chatPanel, filePath2, resultContent2);
    await expectToolRowResult(chatPanel, filePath3, resultContent3);

    await expect(chatPanel.getByText(userText).first()).toBeVisible({ timeout: CHAT_TIMEOUT });
    await expect(
      chatPanel
        .locator('[data-testid="CHAT_MESSAGE"]')
        .filter({ hasText: 'CHAOSWHISPERER' })
        .filter({ hasText: followUpText }),
    ).toHaveCount(ONE_COUNT);

    await page.reload();
    await page.waitForResponse(
      (resp) => resp.url().includes('/api/guilds') && resp.status() === HTTP_OK,
    );

    const replayPanel = page.getByTestId('CHAT_PANEL');

    await expect(replayPanel.getByText(followUpText)).toBeVisible({ timeout: CHAT_TIMEOUT });
    await expect(replayPanel.locator('[data-testid="TOOL_ROW"]')).toHaveCount(PARALLEL_TOOL_COUNT);
    await expect(
      replayPanel.locator('[data-testid="TOOL_ROW"]').filter({ hasText: filePath1 }),
    ).toHaveCount(ONE_COUNT);
    await expect(
      replayPanel.locator('[data-testid="TOOL_ROW"]').filter({ hasText: filePath2 }),
    ).toHaveCount(ONE_COUNT);
    await expect(
      replayPanel.locator('[data-testid="TOOL_ROW"]').filter({ hasText: filePath3 }),
    ).toHaveCount(ONE_COUNT);
    await expect(
      replayPanel.locator('[data-testid="CHAT_MESSAGE"]').filter({ hasText: 'TOOL RESULT' }),
    ).toHaveCount(ZERO_COUNT);
    await expect(
      replayPanel.locator('[data-testid="TOOL_ROW_STATUS"]', { hasText: '✓' }),
    ).toHaveCount(PARALLEL_TOOL_COUNT);

    await expectToolRowResult(replayPanel, filePath1, resultContent1);
    await expectToolRowResult(replayPanel, filePath2, resultContent2);
    await expectToolRowResult(replayPanel, filePath3, resultContent3);

    await expect(replayPanel.getByText(userText).first()).toBeVisible({ timeout: CHAT_TIMEOUT });
    await expect(
      replayPanel
        .locator('[data-testid="CHAT_MESSAGE"]')
        .filter({ hasText: 'CHAOSWHISPERER' })
        .filter({ hasText: followUpText }),
    ).toHaveCount(ONE_COUNT);
  });

  test('VALID: {user message → assistant text → Task sub-agent dispatch → assistant text} => sub-agent chain with inner activity, identical after streaming and after reload', async ({
    page,
    request,
  }) => {
    const guild = await guildHarness({ request }).createGuild({
      name: 'Parity Subagent Guild',
      path: GUILD_PATH,
    });
    const guildId = guildHarness({ request }).extractGuildId({ guild });

    const sessionId = 'e2e-parity-subagent-001';
    const realAgentId = 'paritysubagent1';
    const taskToolUseId = 'toolu_parity_task_dispatchaa';
    const userText = 'parity-subagent-user-msg-5566';
    const preAgentText = 'parity-subagent-pre-agent-text-7788';
    const taskDescription = 'Parity sub-agent does codebase research';
    const subagentInnerText = 'PARITY_SUBAGENT_INNER_MARKER_xyz_2026';
    const finalText = 'parity-subagent-final-text-1199';

    sessions.cleanSessionDirectory();

    // Pre-seed the sub-agent JSONL — chatSubagentTailBroker reads it during streaming
    // (after the parent's tool_use_result.agentId line correlates the agentId), and
    // chatHistoryReplayBroker reads it during subscribe-quest replay. The same file
    // serves both paths.
    sessions.createSubagentTailOnly({
      sessionId,
      agentId: realAgentId,
      assistantText: subagentInnerText,
    });

    claudeMock.queueResponse({
      response: {
        sessionId,
        lines: [
          JSON.stringify(SystemInitStreamLineStub({ session_id: sessionId })),
          JSON.stringify(
            AssistantTextStreamLineStub({
              message: {
                role: 'assistant',
                stop_reason: null,
                content: [{ type: 'text', text: preAgentText }],
              },
            }),
          ),
          JSON.stringify(
            AssistantTaskToolUseStreamLineStub({
              message: {
                role: 'assistant',
                stop_reason: null,
                content: [
                  {
                    type: 'tool_use',
                    id: taskToolUseId,
                    name: 'Task',
                    input: {
                      description: taskDescription,
                      subagent_type: 'general-purpose',
                      prompt: 'Do the parity research',
                    },
                  },
                ],
              },
            }),
          ),
          JSON.stringify(
            TaskToolResultStreamLineStub({
              message: {
                role: 'user',
                content: [
                  { type: 'tool_result', tool_use_id: taskToolUseId, content: 'sub-agent done' },
                ],
              },
              toolUseResult: { agentId: realAgentId },
            }),
          ),
          JSON.stringify(
            AssistantTextStreamLineStub({
              message: {
                role: 'assistant',
                stop_reason: null,
                content: [{ type: 'text', text: finalText }],
              },
            }),
          ),
          JSON.stringify(ResultStreamLineStub({ session_id: sessionId })),
        ],
      },
    });

    await page.goto(`/${guildId}/quest`);
    await page.waitForResponse(
      (resp) => resp.url().includes('/api/guilds') && resp.status() === HTTP_OK,
    );

    await page.getByTestId('CHAT_INPUT').fill(userText);
    await page.getByTestId('SEND_BUTTON').click();

    const chatPanel = page.getByTestId('CHAT_PANEL');

    await expect(chatPanel.getByText(finalText)).toBeVisible({ timeout: CHAT_TIMEOUT });
    await expect(chatPanel.getByText(preAgentText)).toBeVisible({ timeout: CHAT_TIMEOUT });

    const chainHeader = chatPanel.getByTestId('SUBAGENT_CHAIN_HEADER');

    await expect(chainHeader).toContainText(taskDescription, { timeout: CHAT_TIMEOUT });
    await expect(chainHeader).toContainText('1 entries', { timeout: CHAT_TIMEOUT });

    const chainScope = chatPanel.getByTestId('SUBAGENT_CHAIN');

    await expect(chainScope.getByText(subagentInnerText).first()).toBeVisible({
      timeout: CHAT_TIMEOUT,
    });

    await expect(
      chatPanel.locator('[data-testid="CHAT_MESSAGE"]').filter({ hasText: 'TOOL RESULT' }),
    ).toHaveCount(ZERO_COUNT);
    await expect(chatPanel.getByText(userText).first()).toBeVisible({ timeout: CHAT_TIMEOUT });

    await page.reload();
    await page.waitForResponse(
      (resp) => resp.url().includes('/api/guilds') && resp.status() === HTTP_OK,
    );

    const replayPanel = page.getByTestId('CHAT_PANEL');

    await expect(replayPanel.getByText(finalText)).toBeVisible({ timeout: CHAT_TIMEOUT });
    await expect(replayPanel.getByText(preAgentText)).toBeVisible({ timeout: CHAT_TIMEOUT });

    const replayChainHeader = replayPanel.getByTestId('SUBAGENT_CHAIN_HEADER');

    await expect(replayChainHeader).toContainText(taskDescription, { timeout: CHAT_TIMEOUT });
    await expect(replayChainHeader).toContainText('1 entries', { timeout: CHAT_TIMEOUT });

    const replayChainScope = replayPanel.getByTestId('SUBAGENT_CHAIN');

    await expect(replayChainScope.getByText(subagentInnerText).first()).toBeVisible({
      timeout: CHAT_TIMEOUT,
    });
    await expect(
      replayPanel.locator('[data-testid="CHAT_MESSAGE"]').filter({ hasText: 'TOOL RESULT' }),
    ).toHaveCount(ZERO_COUNT);
    await expect(replayPanel.getByText(userText).first()).toBeVisible({ timeout: CHAT_TIMEOUT });
  });

  /*
   * TODO — sub-agent inner-body variants for full parity coverage.
   *
   * The sub-agent test above only exercises the simplest inner body (one assistant
   * text line). The original ask was that the sub-agent does "similar test cases"
   * inside the chain — meaning every shape we cover at the top level should ALSO be
   * covered inside a sub-agent. Each missing variant below should be a separate
   * `test()` block in this describe; the assertion shape mirrors the parent test
   * but scoped to `chatPanel.getByTestId('SUBAGENT_CHAIN')`.
   *
   * `test.skip` / `test.todo` are forbidden by `@dungeonmaster/forbid-todo-skip`,
   * so these are documented here instead of stubbed.
   *
   * 1. Sub-agent: single tool_use + tool_result + text inside the chain.
   *    Setup: use `sessions.createSubagentSessionWithInternalTool({ … })` to
   *    pre-seed the sub-agent JSONL with one assistant tool_use + matching user
   *    tool_result. Parent stream: same as the existing sub-agent test (Task
   *    dispatch, Task completion with realAgentId, parent text bookends).
   *    Assert inside `SUBAGENT_CHAIN`: 1 `TOOL_ROW` with the inner toolName +
   *    input visible, no orphan `TOOL RESULT` cards inside the chain, and the
   *    inner result content visible when the row is expanded. Parent assertions
   *    same as the existing test.
   *
   * 2. Sub-agent: several parallel tool_uses + tool_results + text inside the chain.
   *    Setup: pre-seed the sub-agent JSONL with three separate assistant
   *    tool_use lines + three user tool_result lines (real Claude shape — one
   *    item per line, not bundled), followed by one assistant text. Parent
   *    stream: Task dispatch + completion + parent text bookends.
   *    Assert inside `SUBAGENT_CHAIN`: 3 `TOOL_ROW` elements, each filtered by
   *    its expected file path; `TOOL_ROW_STATUS` count = 3 (every row paired);
   *    zero orphan `TOOL RESULT` cards inside the chain; the sub-agent's final
   *    inner text visible inside the chain scope. The chain header's entry
   *    count should reflect ALL inner entries (texts + tool_uses + tool_results).
   *
   * 3. Sub-agent: assistant text → tool_use + tool_result → assistant text inside
   *    the chain (the conversational variant).
   *    Setup: pre-seed the sub-agent JSONL with assistant text → assistant
   *    tool_use → user tool_result → assistant text. Parent stream: same as
   *    above.
   *    Assert inside `SUBAGENT_CHAIN`: both inner text markers visible in
   *    order, 1 paired `TOOL_ROW` between them, zero orphan TOOL RESULT cards,
   *    chain header entry count reflects all inner entries.
   *
   * Each variant must run BOTH the streaming-then-reload assertion sequence
   * (same shape as the existing 3 tests). The harness helper to pre-seed the
   * sub-agent JSONL with multi-entry bodies needs extending — current
   * `createSubagentSessionWithInternalTool` only handles one tool_use; for
   * variants 2 and 3 you'll need a new helper (e.g.
   * `createSubagentTailMultiEntry`) that accepts a `lines: string[]` array and
   * writes them under `subagents/agent-${agentId}.jsonl`. Mirror the existing
   * helper's parentUuid/timestamp wiring.
   *
   * After all three variants are written, `chat-streaming-subagent-grouping`
   * and `chat-replay-subagent-grouping` may be deprecated — they cover narrower
   * slices of the same convergence invariant.
   */
});
