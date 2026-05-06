import * as crypto from 'crypto';
import { test, expect, wireHarnessLifecycle } from '@dungeonmaster/testing/e2e';
import {
  AssistantTaskToolUseStreamLineStub,
  AssistantTextStreamLineStub,
  ResultStreamLineStub,
  SessionIdStub,
  SystemInitStreamLineStub,
  TaskToolResultStreamLineStub,
  TimeoutMsStub,
} from '@dungeonmaster/shared/contracts';
import { streamLineToJsonLineTransformer } from '@dungeonmaster/shared/transformers';

import { claudeMockHarness } from '../../test/harnesses/claude-mock/claude-mock.harness';
import { environmentHarness } from '../../test/harnesses/environment/environment.harness';
import { guildHarness } from '../../test/harnesses/guild/guild.harness';
import { navigationHarness } from '../../test/harnesses/navigation/navigation.harness';
import { questHarness } from '../../test/harnesses/quest/quest.harness';
import { sessionHarness } from '../../test/harnesses/session/session.harness';

const GUILD_PATH = '/tmp/dm-e2e-execution-subagent-grouping';
const PANEL_TIMEOUT = 10_000;
const CHAIN_TIMEOUT = 10_000;
const HTTP_OK = 200;
// Per-line streaming delay — keeps the mock CLI alive long enough for the browser's
// WS to subscribe BEFORE the live broken emit fires. Without this, the queued response
// finishes streaming before the WS subscribe is ack'd, the live emit is delivered to
// no subscriber, and only the JSONL replay (which uses the converged processor and
// produces a correct chain) reaches the browser — masking the orchestration-loop bug.
const STREAM_DELAY_MS = 500;

const claudeMock = claudeMockHarness({ guildPath: GUILD_PATH });
wireHarnessLifecycle({ harness: claudeMock, testObj: test });
const sessions = sessionHarness({ guildPath: GUILD_PATH });
wireHarnessLifecycle({ harness: sessions, testObj: test });
wireHarnessLifecycle({ harness: environmentHarness({ guildPath: GUILD_PATH }), testObj: test });

// Scenario table — one entry per state the user wants surfaced. Declared as `as const`
// so types are inferred (the raw-type lint rule fires on explicit `: string` annotations
// but not on inferred const-literal types).
//
// `triggerKind: 'start'` — quest seeded at approved, POST /start kicks the orchestration
// loop. Use for in_progress + downstream-role scenarios (chaoswhisperer + pathseeker
// pre-completed, downstream role pending — start transitions to seek_scope, loop sees
// pathseeker complete and dispatches the next ready item).
//
// `triggerKind: 'pauseResume'` — quest seeded at the target seek_* status, POST /pause
// snapshots `pausedAtStatus = preStatus`, POST /resume restores execution there. The
// resume responder auto-inserts a fresh pathseeker work item when status is any-agent-
// running and no pathseeker exists. Use for every pathseeker phased status.
const SCENARIOS = [
  {
    name: 'seek_scope (pathseeker)',
    triggerKind: 'pauseResume',
    preStatus: 'seek_scope',
    seedSteps: [],
    extraWorkItems: [],
  },
  {
    name: 'seek_synth (pathseeker)',
    triggerKind: 'pauseResume',
    preStatus: 'seek_synth',
    seedSteps: [],
    extraWorkItems: [],
  },
  {
    name: 'seek_walk (pathseeker)',
    triggerKind: 'pauseResume',
    preStatus: 'seek_walk',
    seedSteps: [],
    extraWorkItems: [],
  },
  {
    name: 'seek_plan (pathseeker)',
    triggerKind: 'pauseResume',
    preStatus: 'seek_plan',
    seedSteps: [],
    extraWorkItems: [],
  },
  {
    name: 'in_progress + codeweaver',
    triggerKind: 'start',
    preStatus: 'approved',
    seedSteps: [{ id: 'cw-step', name: 'Codeweaver Step' }],
    extraWorkItems: [
      {
        id: 'e2e00000-0000-4000-8000-00000000b001',
        role: 'pathseeker',
        sessionId: 'e2e-ps-codeweaver',
        status: 'complete',
      },
      {
        id: 'e2e00000-0000-4000-8000-00000000c001',
        role: 'codeweaver',
        status: 'pending',
        relatedDataItems: ['steps/cw-step'],
      },
    ],
  },
  {
    name: 'in_progress + lawbringer',
    triggerKind: 'start',
    preStatus: 'approved',
    seedSteps: [{ id: 'lb-step', name: 'Lawbringer Step' }],
    extraWorkItems: [
      {
        id: 'e2e00000-0000-4000-8000-00000000b002',
        role: 'pathseeker',
        sessionId: 'e2e-ps-lawbringer',
        status: 'complete',
      },
      {
        id: 'e2e00000-0000-4000-8000-00000000d001',
        role: 'lawbringer',
        status: 'pending',
        relatedDataItems: ['steps/lb-step'],
      },
    ],
  },
  {
    // Siegemaster's layer broker resolves relatedDataItems[0] to a `flows/<id>`
    // entry (NOT a step). The default harness-seeded flow is `harness-flow`.
    name: 'in_progress + siegemaster',
    triggerKind: 'start',
    preStatus: 'approved',
    seedSteps: [],
    extraWorkItems: [
      {
        id: 'e2e00000-0000-4000-8000-00000000b003',
        role: 'pathseeker',
        sessionId: 'e2e-ps-siegemaster',
        status: 'complete',
      },
      {
        id: 'e2e00000-0000-4000-8000-00000000e001',
        role: 'siegemaster',
        status: 'pending',
        relatedDataItems: ['flows/harness-flow'],
      },
    ],
  },
  {
    name: 'in_progress + spiritmender',
    triggerKind: 'start',
    preStatus: 'approved',
    seedSteps: [],
    extraWorkItems: [
      {
        id: 'e2e00000-0000-4000-8000-00000000b004',
        role: 'pathseeker',
        sessionId: 'e2e-ps-spiritmender',
        status: 'complete',
      },
      {
        id: 'e2e00000-0000-4000-8000-00000000f001',
        role: 'spiritmender',
        status: 'pending',
      },
    ],
  },
] as const;

test.describe('Execution panel sub-agent grouping (orchestration-loop pipeline)', () => {
  test.beforeEach(async ({ request }) => {
    await guildHarness({ request }).cleanGuilds();
    sessions.cleanSessionDirectory();
  });

  for (const scenario of SCENARIOS) {
    test(`VALID: {${scenario.name} streams Task tool_use + sub-agent line with parent_tool_use_id} => execution-panel SUBAGENT_CHAIN groups the sub-agent activity`, async ({
      page,
      request,
    }) => {
      const guilds = guildHarness({ request });
      const guild = await guilds.createGuild({
        name: `Exec Subagent ${scenario.name} Guild`,
        path: GUILD_PATH,
      });
      const guildId = guilds.extractGuildId({ guild });

      const chaoswhispererSessionId = `e2e-cw-${scenario.preStatus}-${Date.now()}`;
      const dispatchedSessionIdValue = `e2e-disp-${scenario.preStatus}-${Date.now()}`;
      const dispatchedSessionId = SessionIdStub({ value: dispatchedSessionIdValue });
      const taskToolUseId = `toolu_grouping_${scenario.preStatus}_${crypto
        .randomBytes(4)
        .toString('hex')}`;
      const SUBAGENT_MARKER = `EXEC_MARKER_${scenario.preStatus}_${crypto
        .randomBytes(4)
        .toString('hex')}`;
      const TASK_DESCRIPTION = `Sub-agent for ${scenario.name}`;

      sessions.createSessionFile({
        sessionId: chaoswhispererSessionId,
        userMessage: 'Build the feature',
      });

      const quests = questHarness({ request });
      const created = await quests.createQuest({
        guildId,
        title: `Exec Subagent ${scenario.name} Quest`,
        userRequest: 'Build the feature with sub-agents',
      });

      // Seed at the trigger's pre-status. /start trigger uses approved; pauseResume
      // trigger uses the target seek_* status so /pause captures it as pausedAtStatus.
      // `seedSteps` is populated for downstream-role start scenarios so the role's
      // layer broker (which validates `relatedDataItems` references a step before
      // dispatch) finds a matching step on the quest.
      quests.writeQuestFile({
        questId: String(created.questId),
        questFolder: created.questFolder,
        questFilePath: created.filePath,
        status: scenario.preStatus,
        steps: [...scenario.seedSteps],
        workItems: [
          {
            id: 'e2e00000-0000-4000-8000-0000000000a1',
            role: 'chaoswhisperer',
            sessionId: chaoswhispererSessionId,
            status: 'complete',
          },
          ...scenario.extraWorkItems,
        ],
      });

      claudeMock.queueResponse({
        response: {
          sessionId: dispatchedSessionId,
          delayMs: TimeoutMsStub({ value: STREAM_DELAY_MS }),
          lines: [
            streamLineToJsonLineTransformer({
              streamLine: SystemInitStreamLineStub({ session_id: dispatchedSessionIdValue }),
            }),
            streamLineToJsonLineTransformer({
              streamLine: AssistantTaskToolUseStreamLineStub({
                message: {
                  role: 'assistant',
                  content: [
                    {
                      type: 'tool_use',
                      id: taskToolUseId,
                      name: 'Agent',
                      input: {
                        description: TASK_DESCRIPTION,
                        subagent_type: 'general-purpose',
                        prompt: 'Do the sub-task',
                      },
                    },
                  ],
                },
              }),
            }),
            // Sub-agent inline line — `parent_tool_use_id` is what Claude CLI stamps
            // on every sub-agent line that arrives via parent stdout. The web's chain
            // grouping requires this line to be normalized into a ChatEntry with
            // `source: 'subagent'` and `agentId = taskToolUseId`. The chat-spawn
            // pipeline does that via `chatLineProcessTransformer`; the orchestration-
            // loop pipeline skips that convergence — that's the regression this test
            // pins. `parent_tool_use_id` is not part of the AssistantStreamLine
            // contract surface, so we spread the stub and add the field on the way
            // through `streamLineToJsonLineTransformer` (which `JSON.stringify`s the
            // object verbatim, preserving extra fields). Same pattern as
            // `session.harness.ts` uses for `uuid`/`timestamp` fields.
            streamLineToJsonLineTransformer({
              streamLine: {
                ...AssistantTextStreamLineStub({
                  message: {
                    role: 'assistant',
                    content: [{ type: 'text', text: SUBAGENT_MARKER }],
                    usage: { input_tokens: 50, output_tokens: 20 },
                  },
                }),
                parent_tool_use_id: taskToolUseId,
                session_id: dispatchedSessionIdValue,
              },
            }),
            streamLineToJsonLineTransformer({
              streamLine: TaskToolResultStreamLineStub({
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
                toolUseResult: {
                  agentId: `realagent${crypto.randomBytes(3).toString('hex')}`,
                  status: 'completed',
                  totalTokens: 100,
                  totalDurationMs: 200,
                  totalToolUseCount: 1,
                },
              }),
            }),
            streamLineToJsonLineTransformer({
              streamLine: AssistantTextStreamLineStub({
                message: {
                  role: 'assistant',
                  content: [{ type: 'text', text: `${scenario.name} dispatch complete` }],
                },
              }),
            }),
            streamLineToJsonLineTransformer({
              streamLine: ResultStreamLineStub({ session_id: dispatchedSessionIdValue }),
            }),
          ],
        },
      });

      // Navigate FIRST so the WS subscribes and history-replay completes before
      // orchestration starts streaming. Otherwise the live emits — particularly
      // the Task tool_use line that's load-bearing for the chain header — race
      // the subscribe-quest handshake and land on a wire with zero subscribers.
      // The fake CLI writes its JSONL only after streaming completes (~3s), and
      // chatReplayJsonlReadBroker only polls 200ms before giving up, so anything
      // emitted pre-subscribe is permanently lost in BOTH live and replay paths.
      const urlSlug = String(guild.urlSlug ?? guild.name)
        .toLowerCase()
        .replace(/\s+/gu, '-');
      await navigationHarness({ page }).navigateToQuest({
        urlSlug,
        questId: String(created.questId),
      });

      // Wait for a stable signal that the WS is subscribed before triggering the
      // orchestration. For pauseResume scenarios (preStatus is seek_*, an execution
      // phase) the execution panel renders immediately. For start scenarios
      // (preStatus: approved) the QuestApprovedModal renders first, so we wait on
      // its title testid — visibility means quest data has loaded over the WS.
      if (scenario.triggerKind === 'start') {
        await expect(page.getByTestId('QUEST_APPROVED_MODAL_TITLE')).toBeVisible({
          timeout: PANEL_TIMEOUT,
        });
      } else {
        await expect(page.getByTestId('execution-panel-widget')).toBeVisible({
          timeout: PANEL_TIMEOUT,
        });
      }

      // Trigger orchestration. /start: approved → seek_scope, loop dispatches first
      // ready agent (downstream role for in_progress scenarios since pathseeker is
      // pre-seeded complete). pauseResume: /pause snapshots pausedAtStatus =
      // preStatus, /resume restores and kicks the loop at that status; the resume
      // responder auto-inserts pathseeker if missing.
      if (scenario.triggerKind === 'start') {
        const startResponse = await request.post(`/api/quests/${created.questId}/start`);

        expect(startResponse.status()).toBe(HTTP_OK);
      } else {
        const pauseResponse = await request.post(`/api/quests/${created.questId}/pause`);

        expect(pauseResponse.status()).toBe(HTTP_OK);

        const resumeResponse = await request.post(`/api/quests/${created.questId}/resume`);

        expect(resumeResponse.status()).toBe(HTTP_OK);
      }

      const executionPanel = page.getByTestId('execution-panel-widget');

      await expect(executionPanel).toBeVisible({ timeout: PANEL_TIMEOUT });

      // Wait for the chain to render at all — `description` text is unique per
      // scenario, so this scopes to the chain we care about and gives streaming
      // time to deliver via either the live or replay path.
      const taskDescChain = executionPanel
        .getByTestId('SUBAGENT_CHAIN_HEADER')
        .filter({ hasText: TASK_DESCRIPTION });

      await expect(taskDescChain.first()).toBeVisible({ timeout: CHAIN_TIMEOUT });

      // Bug shape: when the orchestration-loop pipeline emits sub-agent entries
      // without the chat-line-process convergence, every Task tool_use it ships
      // becomes a chain whose `agentId` resolves to '' on the web — and
      // `subagentMap.get('')` is empty, so the chain renders "(0 entries)". Pinning
      // the inverse fails on the bug today and passes once the orchestration-loop
      // emit goes through the converged processor.
      await expect(executionPanel.getByText('(0 entries)').first()).not.toBeVisible({
        timeout: CHAIN_TIMEOUT,
      });

      // After the fix, only ONE chain header per Task tool_use renders in the
      // panel. Today the broken live-stream emit and the JSONL replay emit BOTH
      // ship a chain group for the same Task (different uuids → uuid-keyed dedup
      // can't collapse them), producing two headers — one with "1 entries" from
      // replay's converged path and one with "(0 entries)" from the orchestration-
      // loop live path. `toHaveCount(1)` fails on the duplicate today and on
      // missing-chain regressions tomorrow.
      await expect(taskDescChain).toHaveCount(1, { timeout: CHAIN_TIMEOUT });
      await expect(taskDescChain).toContainText('1 entries', { timeout: CHAIN_TIMEOUT });

      // The sub-agent's text marker must render INSIDE the chain — not as an orphan
      // singleton below the header. Scope to SUBAGENT_CHAIN to catch the bug shape
      // shown in the screenshot, where ToolSearch/get-agent-prompt rows appeared
      // outside the chain group.
      const chainScope = executionPanel.getByTestId('SUBAGENT_CHAIN').filter({
        has: page.getByTestId('SUBAGENT_CHAIN_HEADER').filter({ hasText: TASK_DESCRIPTION }),
      });

      await expect(chainScope.getByText(SUBAGENT_MARKER).first()).toBeVisible({
        timeout: CHAIN_TIMEOUT,
      });
    });
  }
});
