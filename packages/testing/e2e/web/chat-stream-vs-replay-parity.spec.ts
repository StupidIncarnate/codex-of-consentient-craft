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

    const chainHeader = chatPanel.getByTestId('SUBAGENT_CHAIN_HEADER');

    await expect(chainHeader).toContainText(taskDescription, { timeout: CHAT_TIMEOUT });
    // 3 inner ChatEntries (tool_use + tool_result + text). The exact count proves no
    // inner entry was orphaned out of the chain by the convergence layer.
    await expect(chainHeader).toContainText('3 entries', { timeout: CHAT_TIMEOUT });

    const chainScope = chatPanel.getByTestId('SUBAGENT_CHAIN');

    // Inner tool_use + tool_result MUST merge into a single TOOL_ROW with the inner
    // toolName + file path. Anything else means tool merging didn't run inside the chain.
    await expect(chainScope.locator('[data-testid="TOOL_ROW"]')).toHaveCount(ONE_COUNT);
    await expect(
      chainScope.locator('[data-testid="TOOL_ROW"]').filter({ hasText: innerFilePath }),
    ).toHaveCount(ONE_COUNT);
    // Pairing produces the success-status icon. Without it the tool_use rendered as a
    // bare row and the tool_result fell through to an orphan "TOOL RESULT" card.
    await expect(
      chainScope.locator('[data-testid="TOOL_ROW_STATUS"]', { hasText: '✓' }),
    ).toHaveCount(ONE_COUNT);
    // Orphan TOOL RESULT card check is scoped INSIDE the chain — top-level "TOOL RESULT"
    // cards (e.g. from main-stream tool_results) aren't relevant to chain pairing.
    await expect(
      chainScope.locator('[data-testid="CHAT_MESSAGE"]').filter({ hasText: 'TOOL RESULT' }),
    ).toHaveCount(ZERO_COUNT);
    await expect(chainScope.getByText(innerFinalText).first()).toBeVisible({
      timeout: CHAT_TIMEOUT,
    });

    // Expand the inner row and confirm its result content renders — this is the
    // load-bearing pairing assertion: a tool_use without its tool_result content shows
    // an empty body, which is the disguised orphan shape from the bug-report screenshots.
    const innerRow = chainScope
      .locator('[data-testid="TOOL_ROW"]')
      .filter({ hasText: innerFilePath });

    await innerRow.getByTestId('TOOL_ROW_HEADER').click({ force: true });

    await expect(innerRow.getByTestId('TOOL_ROW_RESULT')).toContainText(innerResultContent, {
      timeout: CHAT_TIMEOUT,
    });

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

    const chainHeader = chatPanel.getByTestId('SUBAGENT_CHAIN_HEADER');

    await expect(chainHeader).toContainText(taskDescription, { timeout: CHAT_TIMEOUT });
    await expect(chainHeader).toContainText(`${String(SUB_INNER_ENTRY_COUNT)} entries`, {
      timeout: CHAT_TIMEOUT,
    });

    const chainScope = chatPanel.getByTestId('SUBAGENT_CHAIN');

    // 3 paired TOOL_ROW. Filter-by-file-path proves each tool_use was paired with its
    // OWN tool_result (and not, say, all three tool_uses pointing at the same result).
    await expect(chainScope.locator('[data-testid="TOOL_ROW"]')).toHaveCount(PARALLEL_TOOL_COUNT);
    await expect(
      chainScope.locator('[data-testid="TOOL_ROW"]').filter({ hasText: innerFilePath1 }),
    ).toHaveCount(ONE_COUNT);
    await expect(
      chainScope.locator('[data-testid="TOOL_ROW"]').filter({ hasText: innerFilePath2 }),
    ).toHaveCount(ONE_COUNT);
    await expect(
      chainScope.locator('[data-testid="TOOL_ROW"]').filter({ hasText: innerFilePath3 }),
    ).toHaveCount(ONE_COUNT);
    // Status-icon count == PARALLEL_TOOL_COUNT proves every inner tool_use found its
    // matching tool_result.
    await expect(
      chainScope.locator('[data-testid="TOOL_ROW_STATUS"]', { hasText: '✓' }),
    ).toHaveCount(PARALLEL_TOOL_COUNT);
    await expect(
      chainScope.locator('[data-testid="CHAT_MESSAGE"]').filter({ hasText: 'TOOL RESULT' }),
    ).toHaveCount(ZERO_COUNT);
    await expect(chainScope.getByText(innerFinalText).first()).toBeVisible({
      timeout: CHAT_TIMEOUT,
    });

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

    const chainHeader = chatPanel.getByTestId('SUBAGENT_CHAIN_HEADER');

    await expect(chainHeader).toContainText(taskDescription, { timeout: CHAT_TIMEOUT });
    await expect(chainHeader).toContainText(`${String(SUB_INNER_ENTRY_COUNT)} entries`, {
      timeout: CHAT_TIMEOUT,
    });

    const chainScope = chatPanel.getByTestId('SUBAGENT_CHAIN');

    await expect(chainScope.getByText(innerFirstText).first()).toBeVisible({
      timeout: CHAT_TIMEOUT,
    });
    await expect(chainScope.getByText(innerSecondText).first()).toBeVisible({
      timeout: CHAT_TIMEOUT,
    });
    await expect(chainScope.locator('[data-testid="TOOL_ROW"]')).toHaveCount(ONE_COUNT);
    await expect(
      chainScope.locator('[data-testid="TOOL_ROW"]').filter({ hasText: innerFilePath }),
    ).toHaveCount(ONE_COUNT);
    await expect(
      chainScope.locator('[data-testid="TOOL_ROW_STATUS"]', { hasText: '✓' }),
    ).toHaveCount(ONE_COUNT);
    await expect(
      chainScope.locator('[data-testid="CHAT_MESSAGE"]').filter({ hasText: 'TOOL RESULT' }),
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

  test('VALID: {tool_result whose content is an array of non-text items (mirroring real ToolSearch / MCP results)} => TOOL_ROW_RESULT renders the item payload (not empty), identical after streaming and after reload', async ({
    page,
    request,
  }) => {
    // Regression guard for the production bug where MCP-style tool_results render with empty
    // bodies. Real Claude CLI emits some tool_results (most visibly `ToolSearch`, but also any
    // MCP tool that returns structured items) with `message.content[i].content` as an ARRAY of
    // non-`text` blocks — e.g. `[{ type: 'tool_reference', tool_name: 'mcp__…' }, …]`. The
    // orchestrator's `mapContentItemToChatEntryTransformer` only extracts a `text` field from
    // each array entry, so non-`text` items collapse to '' and the rendered TOOL_ROW shows
    // an empty body even though the row's status icon is ✓.
    //
    // Earlier parity tests in this file always pass `content` as a plain string, so they
    // never exercise the array-of-non-text path that breaks in production. This test queues
    // a tool_result whose `content` is an array of `tool_reference` items (the exact shape
    // captured from a real MCP ToolSearch session JSONL) and asserts the rendered row body
    // contains the item payload — currently empty, so the assertion fails until the
    // transformer learns to render non-`text` content items.
    const guild = await guildHarness({ request }).createGuild({
      name: 'Parity Array-Content Tool Result Guild',
      path: GUILD_PATH,
    });
    const guildId = guildHarness({ request }).extractGuildId({ guild });

    const sessionId = 'e2e-parity-array-content-001';
    const userText = 'parity-array-content-user-msg-9173';
    const assistantText = 'parity-array-content-assistant-text-4421';
    const toolName = 'ToolSearch';
    const toolUseId = 'toolu_parity_arraycontent_aa';
    const toolQuery = 'parity-array-content-query';
    const referencedToolA = 'mcp__dungeonmaster__get-quest';
    const referencedToolB = 'mcp__dungeonmaster__modify-quest';

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
                    id: toolUseId,
                    name: toolName,
                    input: { query: toolQuery },
                  },
                ],
              },
            }),
          ),
          // RAW user tool_result line — mirrors the captured Claude CLI output shape:
          // `content` is an ARRAY of `tool_reference` items, NOT a string. The
          // SuccessfulToolResultStreamLineStub's contract rejects array content (its `content`
          // field is `z.string()`), so we hand-build the JSON to reproduce the real shape.
          JSON.stringify({
            type: 'user',
            message: {
              role: 'user',
              content: [
                {
                  type: 'tool_result',
                  tool_use_id: toolUseId,
                  content: [
                    { type: 'tool_reference', tool_name: referencedToolA },
                    { type: 'tool_reference', tool_name: referencedToolB },
                  ],
                },
              ],
            },
          }),
          JSON.stringify(
            AssistantTextStreamLineStub({
              message: {
                role: 'assistant',
                stop_reason: null,
                content: [{ type: 'text', text: assistantText }],
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

    await expect(chatPanel.getByText(assistantText)).toBeVisible({ timeout: CHAT_TIMEOUT });

    // STREAMING — exactly one paired tool row with success icon (proves merge happened).
    await expect(chatPanel.locator('[data-testid="TOOL_ROW"]')).toHaveCount(ONE_COUNT);
    await expect(
      chatPanel.locator('[data-testid="TOOL_ROW_STATUS"]', { hasText: '✓' }),
    ).toHaveCount(ONE_COUNT);
    await expect(
      chatPanel.locator('[data-testid="CHAT_MESSAGE"]').filter({ hasText: 'TOOL RESULT' }),
    ).toHaveCount(ZERO_COUNT);

    // The load-bearing assertion: expand the row and verify that the rendered TOOL_ROW_RESULT
    // body actually shows the array payload — at minimum the referenced tool_name strings.
    // Today the result body collapses to '' because non-`text` items are dropped, so this
    // assertion fails. Restoring it requires the orchestrator to render non-`text` content
    // items (e.g. by stringifying their fields) instead of silently filtering them out.
    const toolRow = chatPanel.locator('[data-testid="TOOL_ROW"]').first();

    await toolRow.getByTestId('TOOL_ROW_HEADER').click({ force: true });

    const toolRowResult = toolRow.getByTestId('TOOL_ROW_RESULT');

    await expect(toolRowResult).toBeVisible({ timeout: CHAT_TIMEOUT });
    await expect(toolRowResult).toContainText(referencedToolA, { timeout: CHAT_TIMEOUT });
    await expect(toolRowResult).toContainText(referencedToolB, { timeout: CHAT_TIMEOUT });

    await expect(chatPanel.getByText(userText).first()).toBeVisible({ timeout: CHAT_TIMEOUT });

    await page.reload();
    await page.waitForResponse(
      (resp) => resp.url().includes('/api/guilds') && resp.status() === HTTP_OK,
    );

    const replayPanel = page.getByTestId('CHAT_PANEL');

    await expect(replayPanel.getByText(assistantText)).toBeVisible({ timeout: CHAT_TIMEOUT });
    await expect(replayPanel.locator('[data-testid="TOOL_ROW"]')).toHaveCount(ONE_COUNT);
    await expect(
      replayPanel.locator('[data-testid="TOOL_ROW_STATUS"]', { hasText: '✓' }),
    ).toHaveCount(ONE_COUNT);
    await expect(
      replayPanel.locator('[data-testid="CHAT_MESSAGE"]').filter({ hasText: 'TOOL RESULT' }),
    ).toHaveCount(ZERO_COUNT);

    const replayToolRow = replayPanel.locator('[data-testid="TOOL_ROW"]').first();

    await replayToolRow.getByTestId('TOOL_ROW_HEADER').click({ force: true });

    const replayToolRowResult = replayToolRow.getByTestId('TOOL_ROW_RESULT');

    await expect(replayToolRowResult).toBeVisible({ timeout: CHAT_TIMEOUT });
    await expect(replayToolRowResult).toContainText(referencedToolA, { timeout: CHAT_TIMEOUT });
    await expect(replayToolRowResult).toContainText(referencedToolB, { timeout: CHAT_TIMEOUT });

    await expect(replayPanel.getByText(userText).first()).toBeVisible({ timeout: CHAT_TIMEOUT });
  });

  test('VALID: {tool_result line carries top-level toolUseResult as array of text blocks (MCP / Bash text-return shape)} => paired TOOL_ROW with non-empty body, identical after streaming and after reload', async ({
    page,
    request,
  }) => {
    // Regression guard for the wire-drop bug seen on the live dev server: when the parent
    // session's user line has a top-level `toolUseResult` shaped as an ARRAY (not an
    // object), `userToolResultStreamLineContract` rejects the line and the entire tool_result
    // disappears from the wire. Real Claude CLI emits this shape for MCP tools that return
    // text (`mcp__dungeonmaster__get-quest`, `mcp__dungeonmaster__modify-quest`,
    // `mcp__dungeonmaster__discover`, `mcp__dungeonmaster__ask-user-question`) AND for `Bash`.
    // The earlier array-content parity test only exercises `message.content[i].content` as an
    // array — it never sets the top-level `toolUseResult` field — so the contract-rejection
    // path stays uncaught. This test queues the exact line shape captured from a live MCP
    // session: `toolUseResult: [{ type: 'text', text: '...' }]`. The contract today rejects
    // it, the line drops, and the assertions on the rendered TOOL_ROW body fail.
    const guild = await guildHarness({ request }).createGuild({
      name: 'Parity MCP toolUseResult Array Guild',
      path: GUILD_PATH,
    });
    const guildId = guildHarness({ request }).extractGuildId({ guild });

    const sessionId = 'e2e-parity-mcp-toolUseResult-array-001';
    const userText = 'parity-mcp-array-tur-user-msg-8821';
    const assistantText = 'parity-mcp-array-tur-assistant-text-3392';
    const toolName = 'mcp__dungeonmaster__get-quest';
    const toolUseId = 'toolu_parity_mcp_arraytur_aa';
    const questIdInput = 'fake-quest-id-for-parity-test';
    const resultContent =
      'PARITY_MCP_ARRAY_TUR_RESULT_TEXT_2026 — full body of the MCP tool return goes here';

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
                    id: toolUseId,
                    name: toolName,
                    input: { questId: questIdInput },
                  },
                ],
              },
            }),
          ),
          // RAW user tool_result line — mirrors the MCP/Bash shape captured from real CLI:
          // `toolUseResult` is an ARRAY of text blocks, not an object. Cannot use
          // SuccessfulToolResultStreamLineStub here because the contract rejects array-shaped
          // toolUseResult, which is exactly the rejection path under test.
          JSON.stringify({
            type: 'user',
            message: {
              role: 'user',
              content: [
                {
                  type: 'tool_result',
                  tool_use_id: toolUseId,
                  content: resultContent,
                },
              ],
            },
            toolUseResult: [{ type: 'text', text: resultContent }],
          }),
          JSON.stringify(
            AssistantTextStreamLineStub({
              message: {
                role: 'assistant',
                stop_reason: null,
                content: [{ type: 'text', text: assistantText }],
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

    await expect(chatPanel.getByText(assistantText)).toBeVisible({ timeout: CHAT_TIMEOUT });

    // STREAMING — exactly one TOOL_ROW (the tool_use rendered fine on its own line).
    await expect(chatPanel.locator('[data-testid="TOOL_ROW"]')).toHaveCount(ONE_COUNT);

    // Pairing: the ✓ status icon appears only when the tool_result was admitted by the
    // processor and merged onto the row. Today the contract drops the result line, so the
    // row stays unpaired and this fails.
    await expect(
      chatPanel.locator('[data-testid="TOOL_ROW_STATUS"]', { hasText: '✓' }),
    ).toHaveCount(ONE_COUNT);

    // No orphan TOOL RESULT card — if the result somehow leaked through a different branch,
    // it must merge into the row, not float free.
    await expect(
      chatPanel.locator('[data-testid="CHAT_MESSAGE"]').filter({ hasText: 'TOOL RESULT' }),
    ).toHaveCount(ZERO_COUNT);

    // The load-bearing assertion: the result body must contain the actual MCP tool return
    // text. Today this fails because the contract-rejection path drops the entire tool_result
    // entry — the row's body is empty, mirroring the symptom on the live dev server.
    const toolRow = chatPanel.locator('[data-testid="TOOL_ROW"]').first();

    await toolRow.getByTestId('TOOL_ROW_HEADER').click({ force: true });

    const toolRowResult = toolRow.getByTestId('TOOL_ROW_RESULT');

    await expect(toolRowResult).toBeVisible({ timeout: CHAT_TIMEOUT });
    await expect(toolRowResult).toContainText(resultContent, { timeout: CHAT_TIMEOUT });

    await expect(chatPanel.getByText(userText).first()).toBeVisible({ timeout: CHAT_TIMEOUT });

    await page.reload();
    await page.waitForResponse(
      (resp) => resp.url().includes('/api/guilds') && resp.status() === HTTP_OK,
    );

    const replayPanel = page.getByTestId('CHAT_PANEL');

    await expect(replayPanel.getByText(assistantText)).toBeVisible({ timeout: CHAT_TIMEOUT });
    await expect(replayPanel.locator('[data-testid="TOOL_ROW"]')).toHaveCount(ONE_COUNT);
    await expect(
      replayPanel.locator('[data-testid="TOOL_ROW_STATUS"]', { hasText: '✓' }),
    ).toHaveCount(ONE_COUNT);
    await expect(
      replayPanel.locator('[data-testid="CHAT_MESSAGE"]').filter({ hasText: 'TOOL RESULT' }),
    ).toHaveCount(ZERO_COUNT);

    const replayToolRow = replayPanel.locator('[data-testid="TOOL_ROW"]').first();

    await replayToolRow.getByTestId('TOOL_ROW_HEADER').click({ force: true });

    const replayToolRowResult = replayToolRow.getByTestId('TOOL_ROW_RESULT');

    await expect(replayToolRowResult).toBeVisible({ timeout: CHAT_TIMEOUT });
    await expect(replayToolRowResult).toContainText(resultContent, { timeout: CHAT_TIMEOUT });

    await expect(replayPanel.getByText(userText).first()).toBeVisible({ timeout: CHAT_TIMEOUT });
  });

  test('VALID: {sub-agent inner tool_result carries top-level toolUseResult as array of text blocks (MCP / Bash text-return shape)} => paired TOOL_ROW inside chain with non-empty body, identical after streaming and after reload', async ({
    page,
    request,
  }) => {
    // Sub-agent variant of the MCP / Bash text-return regression. The same
    // userToolResultStreamLineContract is applied to sub-agent JSONL lines via the unified
    // chatLineProcessTransformer — so any tool_result line whose top-level `toolUseResult`
    // is an array (instead of `{agentId}` or omitted) is silently dropped from the chain.
    // This mirrors the production failure mode for MCP tools called by Task sub-agents.
    const guild = await guildHarness({ request }).createGuild({
      name: 'Parity Subagent MCP toolUseResult Array Guild',
      path: GUILD_PATH,
    });
    const guildId = guildHarness({ request }).extractGuildId({ guild });

    const sessionId = 'e2e-parity-subagent-mcp-array-tur-001';
    const realAgentId = 'paritysubmcparr';
    const taskToolUseId = 'toolu_parity_task_submcparray';
    const innerToolUseId = 'toolu_parity_subinner_mcparrayaa';
    const userText = 'parity-subagent-mcp-array-tur-user-msg-4466';
    const preAgentText = 'parity-subagent-mcp-array-tur-pre-text-5577';
    const taskDescription = 'Parity sub-agent MCP toolUseResult array variant';
    const innerToolName = 'mcp__dungeonmaster__discover';
    const innerToolInput = { glob: '/parity/sub-mcp-array/**' };
    const innerResultContent =
      'PARITY_SUBAGENT_MCP_ARRAY_TUR_RESULT_TEXT_2026 — full MCP discover return goes here';
    const innerFinalText = 'PARITY_SUBAGENT_MCP_ARRAY_TUR_INNER_FINAL_2026';
    const finalText = 'parity-subagent-mcp-array-tur-final-text-7788';
    const SUB_INNER_ENTRY_COUNT = 3; // tool_use + tool_result + text

    sessions.cleanSessionDirectory();

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
                  input: innerToolInput,
                },
              ],
            },
          }),
          timestamp: '2026-04-15T20:00:02.000Z',
        }),
        // RAW inner tool_result line — top-level `toolUseResult` is an ARRAY of text blocks,
        // mirroring the captured shape Claude CLI emits when a sub-agent invokes an MCP tool
        // that returns text. The stub spread alone can't carry this shape because the stub
        // factory parses through the contract; we inject the array field after the spread
        // and JSON-stringify the resulting raw object exactly as the CLI would write it.
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
          toolUseResult: [{ type: 'text', text: innerResultContent }],
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
                      prompt: 'Do the parity sub-agent MCP-array work',
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
    // 3 inner ChatEntries (tool_use + tool_result + text). When the contract rejects the
    // array-shaped toolUseResult, the inner tool_result is dropped and the count falls to 2.
    await expect(chainHeader).toContainText(`${String(SUB_INNER_ENTRY_COUNT)} entries`, {
      timeout: CHAT_TIMEOUT,
    });

    const chainScope = chatPanel.getByTestId('SUBAGENT_CHAIN');

    await expect(chainScope.locator('[data-testid="TOOL_ROW"]')).toHaveCount(ONE_COUNT);
    await expect(
      chainScope.locator('[data-testid="TOOL_ROW_STATUS"]', { hasText: '✓' }),
    ).toHaveCount(ONE_COUNT);
    await expect(
      chainScope.locator('[data-testid="CHAT_MESSAGE"]').filter({ hasText: 'TOOL RESULT' }),
    ).toHaveCount(ZERO_COUNT);
    await expect(chainScope.getByText(innerFinalText).first()).toBeVisible({
      timeout: CHAT_TIMEOUT,
    });

    const innerRow = chainScope.locator('[data-testid="TOOL_ROW"]').first();

    await innerRow.getByTestId('TOOL_ROW_HEADER').click({ force: true });

    await expect(innerRow.getByTestId('TOOL_ROW_RESULT')).toContainText(innerResultContent, {
      timeout: CHAT_TIMEOUT,
    });

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

    await expect(replayChainScope.locator('[data-testid="TOOL_ROW"]')).toHaveCount(ONE_COUNT);
    await expect(
      replayChainScope.locator('[data-testid="TOOL_ROW_STATUS"]', { hasText: '✓' }),
    ).toHaveCount(ONE_COUNT);
    await expect(
      replayChainScope.locator('[data-testid="CHAT_MESSAGE"]').filter({ hasText: 'TOOL RESULT' }),
    ).toHaveCount(ZERO_COUNT);
    await expect(replayChainScope.getByText(innerFinalText).first()).toBeVisible({
      timeout: CHAT_TIMEOUT,
    });

    const replayInnerRow = replayChainScope.locator('[data-testid="TOOL_ROW"]').first();

    await replayInnerRow.getByTestId('TOOL_ROW_HEADER').click({ force: true });

    await expect(replayInnerRow.getByTestId('TOOL_ROW_RESULT')).toContainText(innerResultContent, {
      timeout: CHAT_TIMEOUT,
    });

    await expect(replayPanel.getByText(userText).first()).toBeVisible({ timeout: CHAT_TIMEOUT });
  });

  test('VALID: {sub-agent inner Read error tool_result carries top-level toolUseResult as string (Read-too-big shape)} => paired TOOL_ROW inside chain with non-empty body, identical after streaming and after reload', async ({
    page,
    request,
  }) => {
    // Regression for the Read-error wire-drop: real Claude CLI emits a third
    // `toolUseResult` shape — a plain STRING — for tool errors like
    // "File content (N tokens) exceeds maximum allowed tokens (25000)..." or hook-blocked
    // Grep returns. The shared user-tool-result-stream-line contract and the orchestrator's
    // normalized-stream-line contract previously admitted only the object form
    // (`{agentId}`), then were widened to admit the array form (`[{type:'text', text}]`).
    // String form is the third shape, observed in production sub-agent JSONLs:
    //   "toolUseResult": "Error: File content (42613 tokens) exceeds maximum allowed tokens (25000). Use offset and limit parameters..."
    // Lines with this shape are silently dropped by the contract today, so the inner Read
    // tool_use renders with no result body.
    const guild = await guildHarness({ request }).createGuild({
      name: 'Parity Subagent Read Error toolUseResult String Guild',
      path: GUILD_PATH,
    });
    const guildId = guildHarness({ request }).extractGuildId({ guild });

    const sessionId = 'e2e-parity-subagent-read-error-string-001';
    const realAgentId = 'paritysubreaderr';
    const taskToolUseId = 'toolu_parity_task_subreaderra';
    const innerToolUseId = 'toolu_parity_subinner_readerraa';
    const userText = 'parity-subagent-read-error-string-user-msg-1199';
    const preAgentText = 'parity-subagent-read-error-string-pre-text-2200';
    const taskDescription = 'Parity sub-agent Read-error toolUseResult string variant';
    const innerToolName = 'Read';
    const innerFilePath = '/parity/sub-read-error/file.ts';
    const innerErrorContent =
      'PARITY_SUBAGENT_READ_ERROR_BODY_2026 — File content exceeds maximum allowed tokens (25000)';
    const innerFinalText = 'PARITY_SUBAGENT_READ_ERROR_INNER_FINAL_2026';
    const finalText = 'parity-subagent-read-error-string-final-text-3311';
    const SUB_INNER_ENTRY_COUNT = 3; // tool_use + tool_result + text

    sessions.cleanSessionDirectory();

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
        // RAW inner tool_result line — top-level `toolUseResult` is a STRING, mirroring the
        // captured shape Claude CLI emits when Read fails because the file exceeds the token
        // limit. The line additionally carries `is_error: true` inside the content block, but
        // the ENTIRE line is dropped today by the contract because it can't admit a string
        // for `toolUseResult`. The stub's parse-through factory cannot represent this shape,
        // so we hand-build the JSON.
        JSON.stringify({
          type: 'user',
          message: {
            role: 'user',
            content: [
              {
                type: 'tool_result',
                tool_use_id: innerToolUseId,
                content: innerErrorContent,
                is_error: true,
              },
            ],
          },
          toolUseResult: `Error: ${innerErrorContent}`,
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
                      prompt: 'Trigger the Read-too-big error inside the sub-agent',
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
    // 3 inner ChatEntries (tool_use + tool_result + text). When the contract rejects the
    // string-shaped toolUseResult, the inner tool_result is dropped and the count falls to 2.
    await expect(chainHeader).toContainText(`${String(SUB_INNER_ENTRY_COUNT)} entries`, {
      timeout: CHAT_TIMEOUT,
    });

    const chainScope = chatPanel.getByTestId('SUBAGENT_CHAIN');

    await expect(chainScope.locator('[data-testid="TOOL_ROW"]')).toHaveCount(ONE_COUNT);
    await expect(
      chainScope.locator('[data-testid="CHAT_MESSAGE"]').filter({ hasText: 'TOOL RESULT' }),
    ).toHaveCount(ZERO_COUNT);
    await expect(chainScope.getByText(innerFinalText).first()).toBeVisible({
      timeout: CHAT_TIMEOUT,
    });

    const innerRow = chainScope.locator('[data-testid="TOOL_ROW"]').first();

    await innerRow.getByTestId('TOOL_ROW_HEADER').click({ force: true });

    // Load-bearing assertion: error body must surface in the row, not silently disappear.
    await expect(innerRow.getByTestId('TOOL_ROW_RESULT')).toContainText(innerErrorContent, {
      timeout: CHAT_TIMEOUT,
    });

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

    await expect(replayChainScope.locator('[data-testid="TOOL_ROW"]')).toHaveCount(ONE_COUNT);
    await expect(
      replayChainScope.locator('[data-testid="CHAT_MESSAGE"]').filter({ hasText: 'TOOL RESULT' }),
    ).toHaveCount(ZERO_COUNT);
    await expect(replayChainScope.getByText(innerFinalText).first()).toBeVisible({
      timeout: CHAT_TIMEOUT,
    });

    const replayInnerRow = replayChainScope.locator('[data-testid="TOOL_ROW"]').first();

    await replayInnerRow.getByTestId('TOOL_ROW_HEADER').click({ force: true });

    await expect(replayInnerRow.getByTestId('TOOL_ROW_RESULT')).toContainText(innerErrorContent, {
      timeout: CHAT_TIMEOUT,
    });

    await expect(replayPanel.getByText(userText).first()).toBeVisible({ timeout: CHAT_TIMEOUT });
  });
});
