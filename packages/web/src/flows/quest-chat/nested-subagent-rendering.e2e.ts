import { test, expect, wireHarnessLifecycle } from '../../../test/harnesses/e2e-fixtures';
import { AssistantTextStreamLineStub } from '@dungeonmaster/shared/contracts';

import {
  claudeMockHarness,
  ClaudeQueueResponseStub,
} from '../../../test/harnesses/claude-mock/claude-mock.harness';
import { environmentHarness } from '../../../test/harnesses/environment/environment.harness';
import { guildHarness } from '../../../test/harnesses/guild/guild.harness';
import { navigationHarness } from '../../../test/harnesses/navigation/navigation.harness';
import { questHarness } from '../../../test/harnesses/quest/quest.harness';
import { sessionHarness } from '../../../test/harnesses/session/session.harness';

const GUILD_PATH = '/tmp/dm-e2e-nested-subagent-rendering';
const HTTP_OK = 200;
const CHAIN_TIMEOUT = 10_000;

const PARENT_DESCRIPTION = 'Parent agent does work';
const NESTED_DESCRIPTION = 'Nested agent does work';
const PARENT_TEXT = 'PARENT_AGENT_BODY_marker_111';
const NESTED_MARKER = 'NESTED_AGENT_BODY_marker_222';

const claudeMock = claudeMockHarness({ guildPath: GUILD_PATH });
wireHarnessLifecycle({ harness: claudeMock, testObj: test });
const sessions = sessionHarness({ guildPath: GUILD_PATH });
wireHarnessLifecycle({ harness: sessions, testObj: test });
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

test.describe('Nested sub-agent renders recursively (live streaming + reload replay)', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
  });

  test('VALID: {live stream: Task(A) spawns Task(B), B emits nested marker} => nested SUBAGENT_CHAIN renders inside parent chain with the marker visible', async ({
    page,
    request,
  }) => {
    const guild = await guildHarness({ request }).createGuild({
      name: 'Nested Subagent Live Guild',
      path: GUILD_PATH,
    });
    const guildId = guildHarness({ request }).extractGuildId({ guild });

    const sessionId = 'e2e-nested-live-001';
    const toolUseIdA = 'toolu_nested_parent_A';
    const toolUseIdB = 'toolu_nested_child_B';
    const realAgentIdB = 'nestedrealagentb';

    // Pre-create the main session JSONL so the session URL resolves.
    sessions.createSessionFile({ sessionId, userMessage: 'Kick off nested test' });

    // Seed a quest bound to this session so the page renders the interactive chat (not the
    // read-only orphan-session view that hides the chat input).
    const quests = questHarness({ request });
    const created = await quests.createQuest({
      guildId,
      title: 'Nested Subagent Live Quest',
      userRequest: 'Stream nested sub-agents',
    });
    quests.writeQuestFile({
      questId: String(created.questId),
      questFolder: String(created.questFolder),
      questFilePath: String(created.filePath),
      status: 'review_flows',
      workItems: [
        { id: 'e2e00000-0000-4000-8000-000000000101', role: 'chaoswhisperer', sessionId },
      ],
    });

    // Queue a Claude CLI response that streams the FULL nested structure inline using
    // `parent_tool_use_id` (the streaming-source sub-agent correlation field):
    //   - Task(A) at the top level becomes chain A.
    //   - Task(B), carried on a line whose parent_tool_use_id = toolUseIdA, lives inside
    //     chain A and launches chain B; the orchestrator must stamp its parentAgentId =
    //     toolUseIdA so the web nests chain B under chain A.
    //   - B's marker line (parent_tool_use_id = toolUseIdB) is chain B's own content.
    claudeMock.queueResponse({
      response: ClaudeQueueResponseStub({
        sessionId,
        lines: [
          JSON.stringify({
            type: 'system',
            subtype: 'init',
            session_id: sessionId,
            model: 'claude-opus-4-7',
          }),
          // Task(A) — top-level launch → chain A.
          JSON.stringify({
            type: 'assistant',
            session_id: sessionId,
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use',
                  id: toolUseIdA,
                  name: 'Agent',
                  input: {
                    description: PARENT_DESCRIPTION,
                    subagent_type: 'general-purpose',
                    prompt: 'Parent prompt',
                  },
                },
              ],
            },
          }),
          // Agent A's own text — belongs to chain A (parent_tool_use_id = toolUseIdA).
          JSON.stringify({
            type: 'assistant',
            parent_tool_use_id: toolUseIdA,
            session_id: sessionId,
            message: {
              role: 'assistant',
              content: [{ type: 'text', text: PARENT_TEXT }],
            },
          }),
          // Task(B) — launched by A (parent_tool_use_id = toolUseIdA) → nested chain B.
          JSON.stringify({
            type: 'assistant',
            parent_tool_use_id: toolUseIdA,
            session_id: sessionId,
            message: {
              role: 'assistant',
              content: [
                {
                  type: 'tool_use',
                  id: toolUseIdB,
                  name: 'Agent',
                  input: {
                    description: NESTED_DESCRIPTION,
                    subagent_type: 'general-purpose',
                    prompt: 'Nested prompt',
                  },
                },
              ],
            },
          }),
          // Agent B's nested marker — belongs to chain B (parent_tool_use_id = toolUseIdB).
          JSON.stringify({
            type: 'assistant',
            parent_tool_use_id: toolUseIdB,
            session_id: sessionId,
            message: {
              role: 'assistant',
              content: [{ type: 'text', text: NESTED_MARKER }],
            },
          }),
          // B's completion tool_result — co-locates toolUseIdB with realAgentIdB and lives on
          // a line parented to toolUseIdA, registering the nested parent-chain link.
          JSON.stringify({
            type: 'user',
            parent_tool_use_id: toolUseIdA,
            session_id: sessionId,
            message: {
              role: 'user',
              content: [
                { type: 'tool_result', tool_use_id: toolUseIdB, content: 'Nested complete' },
              ],
            },
            tool_use_result: {
              agentId: realAgentIdB,
              status: 'completed',
              content: [{ type: 'text', text: 'Nested complete' }],
              totalTokens: 100,
              totalDurationMs: 200,
              totalToolUseCount: 1,
            },
          }),
          // Top-level wrap-up text so we know streaming finished.
          JSON.stringify(
            AssistantTextStreamLineStub({
              message: { role: 'assistant', content: [{ type: 'text', text: 'All done' }] },
            }),
          ),
          JSON.stringify({
            type: 'result',
            subtype: 'success',
            session_id: sessionId,
            is_error: false,
          }),
        ],
      }),
    });

    await page.goto(`/${guildId}/quest/${created.questId}`);
    await page.waitForResponse(
      (resp) => resp.url().includes('/api/guilds') && resp.status() === HTTP_OK,
    );

    await page.getByTestId('CHAT_INPUT').fill('Stream nested sub-agents');
    await page.getByTestId('SEND_BUTTON').click();

    // Wait for the top-level wrap-up so we know all streamed lines were processed.
    await expect(page.getByText('All done')).toBeVisible({ timeout: CHAIN_TIMEOUT });

    // Both chains render: the parent chain A and the nested chain B.
    await expect(
      page.getByTestId('SUBAGENT_CHAIN_HEADER').filter({ hasText: PARENT_DESCRIPTION }).first(),
    ).toBeVisible({ timeout: CHAIN_TIMEOUT });

    // NESTING: the nested chain B's header must live INSIDE the parent chain A's box.
    const parentChain = page
      .getByTestId('SUBAGENT_CHAIN')
      .filter({
        has: page.getByTestId('SUBAGENT_CHAIN_HEADER').filter({ hasText: PARENT_DESCRIPTION }),
      })
      .first();

    const nestedHeader = parentChain
      .getByTestId('SUBAGENT_CHAIN_HEADER')
      .filter({ hasText: NESTED_DESCRIPTION });

    await expect(nestedHeader).toBeVisible({ timeout: CHAIN_TIMEOUT });
    // The nested chain carries B's own entry (the marker) — a positive entry count.
    await expect(nestedHeader).toContainText('1 entries', { timeout: CHAIN_TIMEOUT });

    // The nested marker is visible inside the nested chain's scope.
    const nestedChain = parentChain
      .getByTestId('SUBAGENT_CHAIN')
      .filter({
        has: page.getByTestId('SUBAGENT_CHAIN_HEADER').filter({ hasText: NESTED_DESCRIPTION }),
      })
      .first();

    await expect(nestedChain.getByText(NESTED_MARKER).first()).toBeVisible({
      timeout: CHAIN_TIMEOUT,
    });
  });

  test('VALID: {reload: 3 nested JSONL files seeded on disk, page navigated to the quest} => replay renders the same recursive nested chain structure with the marker visible', async ({
    page,
    request,
  }) => {
    const guilds = guildHarness({ request });
    const quests = questHarness({ request });
    const nav = navigationHarness({ page });

    const guild = await guilds.createGuild({
      name: 'Nested Subagent Reload Guild',
      path: GUILD_PATH,
    });
    const guildId = guilds.extractGuildId({ guild });

    const sessionId = 'e2e-nested-reload-001';

    // Seed all three JSONL files on disk: main (Task A), agent-A (Task B + body), agent-B
    // (nested marker). The replay broker's three-pass pre-scan resolves both realAgentId
    // translations plus the nested parent-chain link before emitting entries in timestamp
    // order, so chain B reparents under chain A.
    sessions.createNestedSubagentSessionFiles({
      sessionId,
      parentRealAgentId: 'nestedrealparenta',
      nestedRealAgentId: 'nestedrealchildb',
      parentToolUseId: 'toolu_reload_parent_A',
      nestedToolUseId: 'toolu_reload_child_B',
      userMessage: 'Kick off nested reload test',
      parentDescription: PARENT_DESCRIPTION,
      nestedDescription: NESTED_DESCRIPTION,
      parentText: PARENT_TEXT,
      nestedText: NESTED_MARKER,
    });

    const created = await quests.createQuest({
      guildId,
      title: 'Nested Subagent Reload Quest',
      userRequest: 'Replay nested sub-agents',
    });
    quests.writeQuestFile({
      questId: String(created.questId),
      questFolder: String(created.questFolder),
      questFilePath: String(created.filePath),
      status: 'review_flows',
      workItems: [
        { id: 'e2e00000-0000-4000-8000-000000000111', role: 'chaoswhisperer', sessionId },
      ],
    });

    const urlSlug = guilds.extractUrlSlug({ guild });
    await nav.navigateToQuest({ urlSlug, questId: String(created.questId) });

    // Force the session-view history replay (main + every subagent file) so the full nested
    // conversation hydrates the chat panel.
    await nav.triggerReplayFromBrowser({ guildId: String(guildId), sessionIds: [sessionId] });

    // Parent chain A renders.
    await expect(
      page.getByTestId('SUBAGENT_CHAIN_HEADER').filter({ hasText: PARENT_DESCRIPTION }).first(),
    ).toBeVisible({ timeout: CHAIN_TIMEOUT });

    // NESTING: nested chain B's header lives INSIDE the parent chain A's box.
    const parentChain = page
      .getByTestId('SUBAGENT_CHAIN')
      .filter({
        has: page.getByTestId('SUBAGENT_CHAIN_HEADER').filter({ hasText: PARENT_DESCRIPTION }),
      })
      .first();

    const nestedHeader = parentChain
      .getByTestId('SUBAGENT_CHAIN_HEADER')
      .filter({ hasText: NESTED_DESCRIPTION });

    await expect(nestedHeader).toBeVisible({ timeout: CHAIN_TIMEOUT });
    await expect(nestedHeader).toContainText('1 entries', { timeout: CHAIN_TIMEOUT });

    // The nested marker is visible inside the nested chain's scope.
    const nestedChain = parentChain
      .getByTestId('SUBAGENT_CHAIN')
      .filter({
        has: page.getByTestId('SUBAGENT_CHAIN_HEADER').filter({ hasText: NESTED_DESCRIPTION }),
      })
      .first();

    await expect(nestedChain.getByText(NESTED_MARKER).first()).toBeVisible({
      timeout: CHAIN_TIMEOUT,
    });
  });
});
