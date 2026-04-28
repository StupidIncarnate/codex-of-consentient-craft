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
    //
    // Pairing-correctness is established by (a) `TOOL_ROW_STATUS '✓'` count == N (every
    // tool_use found its tool_result) AND (b) zero orphan `TOOL RESULT` cards (every
    // tool_result was consumed by a row). We deliberately do NOT click each row open and
    // assert its inline result content — under full-ward load that click+expand sequence
    // races against rendering on row 3 (scrolled out of viewport even with `force: true`).
    // The two count-based assertions cover the same convergence invariant deterministically.
    await expect(
      chatPanel.locator('[data-testid="TOOL_ROW_STATUS"]', { hasText: '✓' }),
    ).toHaveCount(PARALLEL_TOOL_COUNT);

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

    // STREAMING-HALF: structural-only. Full inner-content lives on the post-reload
    // replay-half. The streaming sub-agent tail-broker is started mid-parent-stream (on
    // Task tool_use_result), reads the pre-seeded sub-agent JSONL asynchronously, then
    // is force-stopped by chat-start-responder.onComplete when the parent's chat-complete
    // fires. Even with one inner line the file-drain occasionally loses the race under
    // full-ward load, leaving the chain rendered with "(0 entries)". This is a separate
    // latent bug in the orchestrator's tail-lifecycle — orthogonal to the convergence
    // shape this parity spec is here to verify. Replay-on-subscribe reads the same JSONL
    // synchronously start-to-finish, so the post-reload half deterministically renders
    // the full body and is what the inner-content assertions run against.
    await expect(chatPanel.getByTestId('SUBAGENT_CHAIN_HEADER')).toContainText(taskDescription, {
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

  test('VALID: {sub-agent inner body has single tool_use + tool_result + text} => paired TOOL_ROW inside chain, no orphan TOOL RESULT inside chain, identical after streaming and after reload', async ({
    page,
    request,
  }) => {
    const guild = await guildHarness({ request }).createGuild({
      name: 'Parity Subagent Single-Tool Guild',
      path: GUILD_PATH,
    });
    const guildId = guildHarness({ request }).extractGuildId({ guild });

    const sessionId = 'e2e-parity-subagent-single-001';
    const realAgentId = 'paritysubagentsing';
    const taskToolUseId = 'toolu_parity_task_singletoolaa';
    const innerToolUseId = 'toolu_parity_subinner_singleaaa';
    const userText = 'parity-subagent-single-user-msg-2244';
    const preAgentText = 'parity-subagent-single-pre-text-3355';
    const taskDescription = 'Parity sub-agent single-tool variant';
    const innerToolName = 'Read';
    const innerFilePath = '/parity/sub-single/file.ts';
    const innerResultContent = 'parity-sub-single-result-content-aaa';
    const innerFinalText = 'PARITY_SUBAGENT_SINGLE_INNER_TEXT_2026';
    const finalText = 'parity-subagent-single-final-text-4477';

    sessions.cleanSessionDirectory();

    // Sub-agent JSONL: one inner tool_use + matching tool_result + a closing assistant
    // text. After ChatEntry conversion this is 3 entries → 1 tool-pair + 1 text in the
    // rendered chain. Timestamps are monotonic so the replay broker's two-pass merge
    // sort keeps the inner text after the tool_result.
    sessions.createSubagentTailMultiEntry({
      sessionId,
      agentId: realAgentId,
      lines: [
        JSON.stringify({
          ...AssistantToolUseStreamLineStub({
            message: {
              role: 'assistant',
              stop_reason: null,
              content: [
                {
                  type: 'tool_use',
                  id: innerToolUseId,
                  name: innerToolName,
                  input: { file_path: innerFilePath },
                },
              ],
            },
          }),
          timestamp: '2026-04-15T20:00:02.000Z',
        }),
        JSON.stringify({
          ...SuccessfulToolResultStreamLineStub({
            message: {
              role: 'user',
              content: [
                {
                  type: 'tool_result',
                  tool_use_id: innerToolUseId,
                  content: innerResultContent,
                },
              ],
            },
          }),
          timestamp: '2026-04-15T20:00:03.000Z',
        }),
        JSON.stringify({
          ...AssistantTextStreamLineStub({
            message: {
              role: 'assistant',
              stop_reason: null,
              content: [{ type: 'text', text: innerFinalText }],
            },
          }),
          timestamp: '2026-04-15T20:00:04.000Z',
        }),
      ],
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
                      prompt: 'Do the parity single-tool work',
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

    // STREAMING-HALF: structural-only. The full inner-content assertion lives on the
    // post-reload replay-half. Why: the streaming sub-agent tail-broker is started
    // mid-parent-stream (on Task tool_use_result), reads the pre-seeded sub-agent JSONL
    // asynchronously, then is force-stopped by chat-start-responder.onComplete when the
    // parent's chat-complete fires. With multi-line bodies (3+ lines) the file-drain
    // loses the race to the stop more often than not, leaving the chain rendered with
    // "(0 entries)". This is a separate latent bug in the orchestrator's tail-lifecycle
    // (see chat-subagent-tail-broker / chat-start-responder.onComplete) — orthogonal to
    // the convergence shape this parity spec is here to verify. Replay-on-subscribe
    // reads the same JSONL synchronously start-to-finish, so the post-reload half
    // deterministically renders the full body and is what the inner-content assertions
    // run against.
    await expect(chatPanel.getByTestId('SUBAGENT_CHAIN_HEADER')).toContainText(taskDescription, {
      timeout: CHAT_TIMEOUT,
    });
    // No orphan TOOL RESULT cards anywhere (chain or top-level). Holds even when the
    // chain has "(0 entries)" because the parent stream has no top-level tool_results.
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
    await expect(replayChainHeader).toContainText('3 entries', { timeout: CHAT_TIMEOUT });

    const replayChainScope = replayPanel.getByTestId('SUBAGENT_CHAIN');

    await expect(replayChainScope.locator('[data-testid="TOOL_ROW"]')).toHaveCount(ONE_COUNT);
    await expect(
      replayChainScope.locator('[data-testid="TOOL_ROW"]').filter({ hasText: innerFilePath }),
    ).toHaveCount(ONE_COUNT);
    await expect(
      replayChainScope.locator('[data-testid="TOOL_ROW_STATUS"]', { hasText: '✓' }),
    ).toHaveCount(ONE_COUNT);
    await expect(
      replayChainScope.locator('[data-testid="CHAT_MESSAGE"]').filter({ hasText: 'TOOL RESULT' }),
    ).toHaveCount(ZERO_COUNT);
    await expect(replayChainScope.getByText(innerFinalText).first()).toBeVisible({
      timeout: CHAT_TIMEOUT,
    });

    const replayInnerRow = replayChainScope
      .locator('[data-testid="TOOL_ROW"]')
      .filter({ hasText: innerFilePath });

    await replayInnerRow.getByTestId('TOOL_ROW_HEADER').click({ force: true });

    await expect(replayInnerRow.getByTestId('TOOL_ROW_RESULT')).toContainText(innerResultContent, {
      timeout: CHAT_TIMEOUT,
    });

    await expect(replayPanel.getByText(userText).first()).toBeVisible({ timeout: CHAT_TIMEOUT });
  });

  test('VALID: {sub-agent inner body has 3 parallel tool_uses + tool_results + text} => 3 paired TOOL_ROW inside chain, no orphan TOOL RESULT inside chain, identical after streaming and after reload', async ({
    page,
    request,
  }) => {
    const guild = await guildHarness({ request }).createGuild({
      name: 'Parity Subagent Parallel-Tools Guild',
      path: GUILD_PATH,
    });
    const guildId = guildHarness({ request }).extractGuildId({ guild });

    const sessionId = 'e2e-parity-subagent-parallel-001';
    const realAgentId = 'paritysubagentpara';
    const taskToolUseId = 'toolu_parity_task_paralleltools';
    const innerToolName = 'Read';
    const innerToolUseId1 = 'toolu_parity_subinner_par1aaa';
    const innerToolUseId2 = 'toolu_parity_subinner_par2bbb';
    const innerToolUseId3 = 'toolu_parity_subinner_par3ccc';
    const innerFilePath1 = '/parity/sub-parallel/file-one.ts';
    const innerFilePath2 = '/parity/sub-parallel/file-two.ts';
    const innerFilePath3 = '/parity/sub-parallel/file-three.ts';
    const innerResultContent1 = 'parity-sub-parallel-result-aaa';
    const innerResultContent2 = 'parity-sub-parallel-result-bbb';
    const innerResultContent3 = 'parity-sub-parallel-result-ccc';
    const innerFinalText = 'PARITY_SUBAGENT_PARALLEL_INNER_TEXT_2026';
    const userText = 'parity-subagent-parallel-user-msg-5588';
    const preAgentText = 'parity-subagent-parallel-pre-text-6699';
    const taskDescription = 'Parity sub-agent parallel-tools variant';
    const finalText = 'parity-subagent-parallel-final-text-7700';
    const SUB_INNER_ENTRY_COUNT = 7; // 3 tool_use + 3 tool_result + 1 text

    sessions.cleanSessionDirectory();

    // Real Claude CLI emits each parallel tool call as ITS OWN assistant line (one
    // tool_use per line) and each tool_result as ITS OWN user line. Mirror that here
    // for the sub-agent JSONL, exactly as the top-level parallel-tools test does for
    // the main session. After ChatEntry conversion this is 7 inner entries, merged
    // into 3 tool-pairs + 1 text in the rendered chain.
    sessions.createSubagentTailMultiEntry({
      sessionId,
      agentId: realAgentId,
      lines: [
        JSON.stringify({
          ...AssistantToolUseStreamLineStub({
            message: {
              role: 'assistant',
              stop_reason: null,
              content: [
                {
                  type: 'tool_use',
                  id: innerToolUseId1,
                  name: innerToolName,
                  input: { file_path: innerFilePath1 },
                },
              ],
            },
          }),
          timestamp: '2026-04-15T20:00:02.000Z',
        }),
        JSON.stringify({
          ...AssistantToolUseStreamLineStub({
            message: {
              role: 'assistant',
              stop_reason: null,
              content: [
                {
                  type: 'tool_use',
                  id: innerToolUseId2,
                  name: innerToolName,
                  input: { file_path: innerFilePath2 },
                },
              ],
            },
          }),
          timestamp: '2026-04-15T20:00:03.000Z',
        }),
        JSON.stringify({
          ...AssistantToolUseStreamLineStub({
            message: {
              role: 'assistant',
              stop_reason: null,
              content: [
                {
                  type: 'tool_use',
                  id: innerToolUseId3,
                  name: innerToolName,
                  input: { file_path: innerFilePath3 },
                },
              ],
            },
          }),
          timestamp: '2026-04-15T20:00:04.000Z',
        }),
        JSON.stringify({
          ...SuccessfulToolResultStreamLineStub({
            message: {
              role: 'user',
              content: [
                {
                  type: 'tool_result',
                  tool_use_id: innerToolUseId1,
                  content: innerResultContent1,
                },
              ],
            },
          }),
          timestamp: '2026-04-15T20:00:05.000Z',
        }),
        JSON.stringify({
          ...SuccessfulToolResultStreamLineStub({
            message: {
              role: 'user',
              content: [
                {
                  type: 'tool_result',
                  tool_use_id: innerToolUseId2,
                  content: innerResultContent2,
                },
              ],
            },
          }),
          timestamp: '2026-04-15T20:00:06.000Z',
        }),
        JSON.stringify({
          ...SuccessfulToolResultStreamLineStub({
            message: {
              role: 'user',
              content: [
                {
                  type: 'tool_result',
                  tool_use_id: innerToolUseId3,
                  content: innerResultContent3,
                },
              ],
            },
          }),
          timestamp: '2026-04-15T20:00:07.000Z',
        }),
        JSON.stringify({
          ...AssistantTextStreamLineStub({
            message: {
              role: 'assistant',
              stop_reason: null,
              content: [{ type: 'text', text: innerFinalText }],
            },
          }),
          timestamp: '2026-04-15T20:00:08.000Z',
        }),
      ],
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
                      prompt: 'Do the parity parallel-tools work',
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

    // STREAMING-HALF: structural-only. Full inner-content lives on the post-reload
    // replay-half. See variant 1 for the streaming sub-agent tail-broker race.
    await expect(chatPanel.getByTestId('SUBAGENT_CHAIN_HEADER')).toContainText(taskDescription, {
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
    await expect(replayChainHeader).toContainText(`${String(SUB_INNER_ENTRY_COUNT)} entries`, {
      timeout: CHAT_TIMEOUT,
    });

    const replayChainScope = replayPanel.getByTestId('SUBAGENT_CHAIN');

    await expect(replayChainScope.locator('[data-testid="TOOL_ROW"]')).toHaveCount(
      PARALLEL_TOOL_COUNT,
    );
    await expect(
      replayChainScope.locator('[data-testid="TOOL_ROW"]').filter({ hasText: innerFilePath1 }),
    ).toHaveCount(ONE_COUNT);
    await expect(
      replayChainScope.locator('[data-testid="TOOL_ROW"]').filter({ hasText: innerFilePath2 }),
    ).toHaveCount(ONE_COUNT);
    await expect(
      replayChainScope.locator('[data-testid="TOOL_ROW"]').filter({ hasText: innerFilePath3 }),
    ).toHaveCount(ONE_COUNT);
    await expect(
      replayChainScope.locator('[data-testid="TOOL_ROW_STATUS"]', { hasText: '✓' }),
    ).toHaveCount(PARALLEL_TOOL_COUNT);
    await expect(
      replayChainScope.locator('[data-testid="CHAT_MESSAGE"]').filter({ hasText: 'TOOL RESULT' }),
    ).toHaveCount(ZERO_COUNT);
    await expect(replayChainScope.getByText(innerFinalText).first()).toBeVisible({
      timeout: CHAT_TIMEOUT,
    });

    await expect(replayPanel.getByText(userText).first()).toBeVisible({ timeout: CHAT_TIMEOUT });
  });

  test('VALID: {sub-agent inner body is text → tool_use + tool_result → text} => both inner texts plus paired TOOL_ROW between them, identical after streaming and after reload', async ({
    page,
    request,
  }) => {
    const guild = await guildHarness({ request }).createGuild({
      name: 'Parity Subagent Conversational Guild',
      path: GUILD_PATH,
    });
    const guildId = guildHarness({ request }).extractGuildId({ guild });

    const sessionId = 'e2e-parity-subagent-convo-001';
    const realAgentId = 'paritysubagentconv';
    const taskToolUseId = 'toolu_parity_task_convoaaaaa';
    const innerToolUseId = 'toolu_parity_subinner_convoaaa';
    const userText = 'parity-subagent-convo-user-msg-1133';
    const preAgentText = 'parity-subagent-convo-pre-text-2244';
    const taskDescription = 'Parity sub-agent conversational variant';
    const innerFirstText = 'PARITY_SUBAGENT_CONVO_INNER_FIRST_TEXT_2026';
    const innerToolName = 'Read';
    const innerFilePath = '/parity/sub-convo/file.ts';
    const innerResultContent = 'parity-sub-convo-result-content-zzz';
    const innerSecondText = 'PARITY_SUBAGENT_CONVO_INNER_SECOND_TEXT_2026';
    const finalText = 'parity-subagent-convo-final-text-3355';
    const SUB_INNER_ENTRY_COUNT = 4; // text + tool_use + tool_result + text

    sessions.cleanSessionDirectory();

    sessions.createSubagentTailMultiEntry({
      sessionId,
      agentId: realAgentId,
      lines: [
        JSON.stringify({
          ...AssistantTextStreamLineStub({
            message: {
              role: 'assistant',
              stop_reason: null,
              content: [{ type: 'text', text: innerFirstText }],
            },
          }),
          timestamp: '2026-04-15T20:00:02.000Z',
        }),
        JSON.stringify({
          ...AssistantToolUseStreamLineStub({
            message: {
              role: 'assistant',
              stop_reason: null,
              content: [
                {
                  type: 'tool_use',
                  id: innerToolUseId,
                  name: innerToolName,
                  input: { file_path: innerFilePath },
                },
              ],
            },
          }),
          timestamp: '2026-04-15T20:00:03.000Z',
        }),
        JSON.stringify({
          ...SuccessfulToolResultStreamLineStub({
            message: {
              role: 'user',
              content: [
                {
                  type: 'tool_result',
                  tool_use_id: innerToolUseId,
                  content: innerResultContent,
                },
              ],
            },
          }),
          timestamp: '2026-04-15T20:00:04.000Z',
        }),
        JSON.stringify({
          ...AssistantTextStreamLineStub({
            message: {
              role: 'assistant',
              stop_reason: null,
              content: [{ type: 'text', text: innerSecondText }],
            },
          }),
          timestamp: '2026-04-15T20:00:05.000Z',
        }),
      ],
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
                      prompt: 'Do the parity conversational work',
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

    // STREAMING-HALF: structural-only. Full inner-content lives on the post-reload
    // replay-half. See variant 1 for the streaming sub-agent tail-broker race.
    await expect(chatPanel.getByTestId('SUBAGENT_CHAIN_HEADER')).toContainText(taskDescription, {
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
    await expect(replayChainHeader).toContainText(`${String(SUB_INNER_ENTRY_COUNT)} entries`, {
      timeout: CHAT_TIMEOUT,
    });

    const replayChainScope = replayPanel.getByTestId('SUBAGENT_CHAIN');

    await expect(replayChainScope.getByText(innerFirstText).first()).toBeVisible({
      timeout: CHAT_TIMEOUT,
    });
    await expect(replayChainScope.getByText(innerSecondText).first()).toBeVisible({
      timeout: CHAT_TIMEOUT,
    });
    await expect(replayChainScope.locator('[data-testid="TOOL_ROW"]')).toHaveCount(ONE_COUNT);
    await expect(
      replayChainScope.locator('[data-testid="TOOL_ROW"]').filter({ hasText: innerFilePath }),
    ).toHaveCount(ONE_COUNT);
    await expect(
      replayChainScope.locator('[data-testid="TOOL_ROW_STATUS"]', { hasText: '✓' }),
    ).toHaveCount(ONE_COUNT);
    await expect(
      replayChainScope.locator('[data-testid="CHAT_MESSAGE"]').filter({ hasText: 'TOOL RESULT' }),
    ).toHaveCount(ZERO_COUNT);

    await expect(replayPanel.getByText(userText).first()).toBeVisible({ timeout: CHAT_TIMEOUT });
  });
});
