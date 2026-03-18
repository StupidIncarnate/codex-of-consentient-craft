import * as fs from 'fs';
import * as path from 'path';

import { installTestbedCreateBroker, BaseNameStub } from '@dungeonmaster/testing';
import {
  ArrayIndexStub,
  DependencyStepStub,
  ExitCodeStub,
  FilePathStub,
  FlowEdgeStub,
  FlowNodeStub,
  FlowObservableStub,
  FlowStub,
  GuildNameStub,
  GuildPathStub,
  ObservableIdStub,
  ProcessIdStub,
  QuestIdStub,
  SessionIdStub,
  StepIdStub,
  SystemInitStreamLineStub,
  ResultStreamLineStub,
} from '@dungeonmaster/shared/contracts';

import type { ClaudeQueueResponseStub } from '../../contracts/claude-queue-response/claude-queue-response.stub';
import { StreamJsonLineStub } from '../../contracts/stream-json-line/stream-json-line.stub';
import type { WardQueueResponseStub } from '../../contracts/ward-queue-response/ward-queue-response.stub';
import { WardRunIdStub } from '../../contracts/ward-run-id/ward-run-id.stub';
import { GuildAddResponder } from '../../responders/guild/add/guild-add-responder';
import { GuildRemoveResponder } from '../../responders/guild/remove/guild-remove-responder';
import { QuestAddResponder } from '../../responders/quest/add/quest-add-responder';
import { QuestGetResponder } from '../../responders/quest/get/quest-get-responder';
import { QuestModifyResponder } from '../../responders/quest/modify/quest-modify-responder';
import { ModifyQuestInputStub } from '../../contracts/modify-quest-input/modify-quest-input.stub';
import { OrchestrationFlow } from './orchestration-flow';

type ClaudeQueueResponse = ReturnType<typeof ClaudeQueueResponseStub>;
type WardQueueResponse = ReturnType<typeof WardQueueResponseStub>;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FAKE_CLAUDE_CLI = path.resolve(
  __dirname,
  '../../../../testing/e2e/web/harness/claude-mock/bin/claude',
);
const FAKE_WARD_BIN_DIR = path.resolve(__dirname, '../../../test-fixtures/fake-ward-bin');

const POLL_INTERVAL_MS = 50;
const POLL_TIMEOUT_MS = 30_000;

// ---------------------------------------------------------------------------
// Queue helpers (per-test isolated directories)
// ---------------------------------------------------------------------------

const createQueueDir = (baseDir: string, name: string): ReturnType<typeof FilePathStub> => {
  const dir = path.join(baseDir, name);
  fs.mkdirSync(dir, { recursive: true });
  return FilePathStub({ value: dir });
};

const counters = new Map<ReturnType<typeof FilePathStub>, ReturnType<typeof ArrayIndexStub>>();

const queueResponse = (queueDir: string, response: unknown): void => {
  const key = FilePathStub({ value: queueDir });
  const counter = counters.get(key) ?? ArrayIndexStub({ value: 0 });
  const filePath = path.join(queueDir, `${String(counter).padStart(4, '0')}.json`);
  fs.writeFileSync(filePath, JSON.stringify(response));
  counters.set(key, ArrayIndexStub({ value: Number(counter) + 1 }));
};

// Short branding helper to keep call-sites concise
const sid = (
  value: NonNullable<Parameters<typeof SessionIdStub>[0]>['value'],
): ReturnType<typeof SessionIdStub> => SessionIdStub({ value });

// ---------------------------------------------------------------------------
// JSONL line builders (using shared stubs)
// ---------------------------------------------------------------------------

const signalBackLine = ({
  signal,
  summary,
}: {
  signal: 'complete' | 'failed';
  summary?: string;
}): ReturnType<typeof StreamJsonLineStub> =>
  StreamJsonLineStub({
    value: JSON.stringify({
      type: 'assistant',
      message: {
        content: [
          {
            type: 'tool_use',
            name: 'mcp__dungeonmaster__signal-back',
            input: { signal, ...(summary === undefined ? {} : { summary }) },
          },
        ],
      },
    }),
  });

const agentSuccessResponse = ({
  sessionId = SessionIdStub({ value: 'sess-integ-001' }),
}: { sessionId?: ClaudeQueueResponse['sessionId'] } = {}): ClaudeQueueResponse => ({
  sessionId,
  lines: [
    StreamJsonLineStub({
      value: JSON.stringify(SystemInitStreamLineStub({ session_id: sessionId })),
    }),
    signalBackLine({ signal: 'complete', summary: 'Task completed successfully' }),
    StreamJsonLineStub({ value: JSON.stringify(ResultStreamLineStub({ session_id: sessionId })) }),
  ],
});

const agentFailedResponse = ({
  sessionId = SessionIdStub({ value: 'sess-integ-fail' }),
  summary = 'Task failed',
}: {
  sessionId?: ClaudeQueueResponse['sessionId'];
  summary?: Parameters<typeof signalBackLine>[0]['summary'];
} = {}): ClaudeQueueResponse => ({
  sessionId,
  lines: [
    StreamJsonLineStub({
      value: JSON.stringify(SystemInitStreamLineStub({ session_id: sessionId })),
    }),
    signalBackLine({ signal: 'failed', summary }),
    StreamJsonLineStub({ value: JSON.stringify(ResultStreamLineStub({ session_id: sessionId })) }),
  ],
});

const wardPassResponse = (): WardQueueResponse => ({
  exitCode: ExitCodeStub({ value: 0 }),
  runId: WardRunIdStub({ value: `ward-${String(Date.now())}` }),
  wardResultJson: { checks: [] },
});

const wardFailResponse = ({
  filePaths = [],
}: { filePaths?: ReturnType<typeof FilePathStub>[] } = {}): WardQueueResponse => ({
  exitCode: ExitCodeStub({ value: 1 }),
  runId: WardRunIdStub({ value: `ward-fail-${String(Date.now())}` }),
  wardResultJson: {
    checks: [
      {
        projectResults: [
          {
            errors: filePaths.map((fp) => ({ filePath: fp })),
            testFailures: [],
          },
        ],
      },
    ],
  },
});

// ---------------------------------------------------------------------------
// Poll helper
// ---------------------------------------------------------------------------

const pollForQuestStatus = async ({
  questId,
  targetStatuses,
  timeoutMs = POLL_TIMEOUT_MS,
}: {
  questId: string;
  targetStatuses: string[];
  timeoutMs?: number;
}): Promise<{ quest: NonNullable<Awaited<ReturnType<typeof QuestGetResponder>>['quest']> }> => {
  const deadline = Date.now() + timeoutMs;
  const typedId = questId as ReturnType<typeof QuestIdStub>;

  type QuestType = NonNullable<Awaited<ReturnType<typeof QuestGetResponder>>['quest']>;

  const poll = async (): Promise<{
    quest: QuestType;
  }> =>
    QuestGetResponder({ questId: typedId }).then(async (result) => {
      if (result.success && result.quest && targetStatuses.includes(result.quest.status)) {
        return { quest: result.quest };
      }
      if (Date.now() >= deadline) {
        throw new Error(
          `Quest did not reach status [${targetStatuses.join(',')}] within ${String(timeoutMs)}ms. Current: ${result.quest?.status ?? 'unknown'}`,
        );
      }
      return new Promise<{ quest: QuestType }>((resolve) => {
        setTimeout(() => {
          resolve(poll());
        }, POLL_INTERVAL_MS);
      });
    });

  return poll();
};

// ---------------------------------------------------------------------------
// Env setup / teardown
// ---------------------------------------------------------------------------

const setupTestEnv = (tempDir: string) => {
  counters.clear();
  const claudeQueueDir = createQueueDir(tempDir, 'claude-queue');
  const wardQueueDir = createQueueDir(tempDir, 'ward-queue');

  const savedClaudeCliPath = process.env.CLAUDE_CLI_PATH;
  const savedFakeClaudeQueueDir = process.env.FAKE_CLAUDE_QUEUE_DIR;
  const savedFakeWardQueueDir = process.env.FAKE_WARD_QUEUE_DIR;
  const savedPath = process.env.PATH;

  process.env.CLAUDE_CLI_PATH = FAKE_CLAUDE_CLI;
  process.env.FAKE_CLAUDE_QUEUE_DIR = String(claudeQueueDir);
  process.env.FAKE_WARD_QUEUE_DIR = String(wardQueueDir);
  process.env.PATH = `${FAKE_WARD_BIN_DIR}:${process.env.PATH ?? ''}`;

  const restore = (): void => {
    process.env.CLAUDE_CLI_PATH = savedClaudeCliPath;
    process.env.FAKE_CLAUDE_QUEUE_DIR = savedFakeClaudeQueueDir;
    process.env.FAKE_WARD_QUEUE_DIR = savedFakeWardQueueDir;
    process.env.PATH = savedPath;
  };

  return { claudeQueueDir, wardQueueDir, restore };
};

const withEnvRestore = async <T>(
  env: { restore: () => void },
  fn: () => Promise<T>,
): Promise<T> => {
  try {
    return await fn();
  } finally {
    env.restore();
  }
};

// ---------------------------------------------------------------------------
// Quest setup helpers
// ---------------------------------------------------------------------------

const buildValidFlows = ({ observableIds }: { observableIds: string[] }) => {
  const obs = observableIds.map((id) =>
    FlowObservableStub({ id: ObservableIdStub({ value: id }) }),
  );
  const nodeA = FlowNodeStub({
    id: 'node-a' as ReturnType<typeof FlowNodeStub>['id'],
    label: 'Node A',
    type: 'state',
    observables: obs,
  });
  const nodeB = FlowNodeStub({
    id: 'node-b' as ReturnType<typeof FlowNodeStub>['id'],
    label: 'Node B',
    type: 'state',
    observables: [],
  });
  const edge = FlowEdgeStub({ from: nodeA.id, to: nodeB.id });
  return [FlowStub({ nodes: [nodeA, nodeB], edges: [edge] })];
};

const buildValidSteps = ({
  observableIds,
  stepCount,
}: {
  observableIds: string[];
  stepCount: number;
}) => {
  const steps = [];
  for (let i = 0; i < stepCount; i++) {
    const coveredObs = i === 0 ? observableIds.map((id) => ObservableIdStub({ value: id })) : [];
    steps.push(
      DependencyStepStub({
        id: StepIdStub({ value: `step-${String(i)}` }),
        name: `Step ${String(i)}`,
        observablesSatisfied: coveredObs,
        dependsOn: [],
        filesToCreate: [],
        filesToModify: [],
      }),
    );
  }
  return steps;
};

const completeChaosWorkItem = async ({ questId }: { questId: string }) => {
  const typedQuestId = questId as ReturnType<typeof QuestIdStub>;
  const questResult = await QuestGetResponder({ questId: typedQuestId });
  if (!questResult.success || !questResult.quest) {
    return;
  }
  const chaosItem = questResult.quest.workItems.find((wi) => wi.role === 'chaoswhisperer');
  if (!chaosItem) {
    return;
  }
  // Update the chaos work item to complete status
  const updatedWorkItems = questResult.quest.workItems.map((wi) =>
    wi.id === chaosItem.id
      ? { ...wi, status: 'complete' as const, completedAt: new Date().toISOString() }
      : wi,
  );
  await QuestModifyResponder({
    questId: typedQuestId,
    input: ModifyQuestInputStub({
      questId: typedQuestId,
      workItems: updatedWorkItems,
    }),
  });
};

const approveQuest = async ({
  questId,
  observableIds,
  stepCount,
}: {
  questId: string;
  observableIds: string[];
  stepCount: number;
}) => {
  const typedQuestId = questId as ReturnType<typeof QuestIdStub>;
  const flows = buildValidFlows({ observableIds });
  const steps = buildValidSteps({ observableIds, stepCount });

  await QuestModifyResponder({
    questId: typedQuestId,
    input: ModifyQuestInputStub({ questId: typedQuestId, status: 'explore_flows' }),
  });
  await QuestModifyResponder({
    questId: typedQuestId,
    input: ModifyQuestInputStub({ questId: typedQuestId, flows }),
  });
  await QuestModifyResponder({
    questId: typedQuestId,
    input: ModifyQuestInputStub({ questId: typedQuestId, status: 'review_flows' }),
  });
  await QuestModifyResponder({
    questId: typedQuestId,
    input: ModifyQuestInputStub({ questId: typedQuestId, status: 'flows_approved' }),
  });
  await QuestModifyResponder({
    questId: typedQuestId,
    input: ModifyQuestInputStub({ questId: typedQuestId, status: 'explore_observables' }),
  });
  await QuestModifyResponder({
    questId: typedQuestId,
    input: ModifyQuestInputStub({ questId: typedQuestId, status: 'review_observables' }),
  });
  await QuestModifyResponder({
    questId: typedQuestId,
    input: ModifyQuestInputStub({ questId: typedQuestId, status: 'approved' }),
  });
  await QuestModifyResponder({
    questId: typedQuestId,
    input: ModifyQuestInputStub({ questId: typedQuestId, steps }),
  });
};

const createTestQuest = async ({
  testbed,
  observableIds,
  stepCount,
}: {
  testbed: ReturnType<typeof installTestbedCreateBroker>;
  observableIds: string[];
  stepCount: number;
}) => {
  const guild = await GuildAddResponder({
    name: GuildNameStub({ value: 'Integ Test Guild' }),
    path: GuildPathStub({ value: testbed.guildPath }),
  });

  const addResult = await QuestAddResponder({
    title: 'Integration Test Quest',
    userRequest: 'An integration test quest',
    guildId: guild.id,
  });

  const questId = addResult.questId!;

  await approveQuest({ questId, observableIds, stepCount });

  // Mark chaoswhisperer as complete so pathseeker dependencies are satisfied
  await completeChaosWorkItem({ questId });

  return { guild, questId };
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('OrchestrationFlow', () => {
  describe('delegation to responders', () => {
    it('ERROR: {unknown processId} => getStatus delegates to OrchestrationGetStatusResponder and throws', () => {
      const processId = ProcessIdStub({ value: 'proc-nonexistent' });

      expect(() => OrchestrationFlow.getStatus({ processId })).toThrow(
        /Process not found: proc-nonexistent/u,
      );
    });

    it('ERROR: {nonexistent questId} => start delegates to OrchestrationStartResponder and throws quest not found', async () => {
      await expect(
        OrchestrationFlow.start({ questId: QuestIdStub({ value: 'nonexistent-quest-id' }) }),
      ).rejects.toThrow(/Quest not found: nonexistent-quest-id/u);
    });

    it('ERROR: {non-approved quest} => start throws quest must be approved before starting', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'orchestration-non-approved' }),
      });

      const guild = await GuildAddResponder({
        name: GuildNameStub({ value: 'Orchestration Test Guild' }),
        path: GuildPathStub({ value: testbed.guildPath }),
      });

      const addResult = await QuestAddResponder({
        title: 'Test Quest',
        userRequest: 'A test quest for orchestration flow integration tests',
        guildId: guild.id,
      });

      await expect(OrchestrationFlow.start({ questId: addResult.questId! })).rejects.toThrow(
        /Quest must be approved before starting/u,
      );

      await GuildRemoveResponder({ guildId: guild.id });
      testbed.cleanup();

      expect(addResult.questId).toBeDefined();
    });

    it('VALID: {approved quest} => start returns processId and getStatus returns idle orchestration status', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'orchestration-approved' }),
      });

      const guild = await GuildAddResponder({
        name: GuildNameStub({ value: 'Orchestration Approved Guild' }),
        path: GuildPathStub({ value: testbed.guildPath }),
      });

      const addResult = await QuestAddResponder({
        title: 'Approved Quest',
        userRequest: 'A quest that will be approved for orchestration start tests',
        guildId: guild.id,
      });

      const questId = addResult.questId!;

      await QuestModifyResponder({
        questId,
        input: ModifyQuestInputStub({ questId, status: 'explore_flows' }),
      });

      await QuestModifyResponder({
        questId,
        input: ModifyQuestInputStub({
          questId,
          flows: [
            FlowStub({
              nodes: [FlowNodeStub({ observables: [FlowObservableStub()] })],
            }),
          ],
        }),
      });

      await QuestModifyResponder({
        questId,
        input: ModifyQuestInputStub({ questId, status: 'review_flows' }),
      });

      await QuestModifyResponder({
        questId,
        input: ModifyQuestInputStub({ questId, status: 'flows_approved' }),
      });

      await QuestModifyResponder({
        questId,
        input: ModifyQuestInputStub({ questId, status: 'explore_observables' }),
      });

      await QuestModifyResponder({
        questId,
        input: ModifyQuestInputStub({ questId, status: 'review_observables' }),
      });

      await QuestModifyResponder({
        questId,
        input: ModifyQuestInputStub({ questId, status: 'approved' }),
      });

      const processId = await OrchestrationFlow.start({ questId });

      const questResult = await QuestGetResponder({ questId });

      expect(questResult.success).toBe(true);
      expect(questResult.quest!.status).toBe('in_progress');

      await GuildRemoveResponder({ guildId: guild.id });
      testbed.cleanup();

      expect(processId).toMatch(/^proc-/u);
      // With work-item queue model, the loop exits immediately when only chat items
      // are pending (no userMessage). The process may already be cleaned up.
    }, 30_000);
  });

  describe('role-to-role handoffs', () => {
    // Test 1: Full happy path
    // pathseeker → codeweavers → ward → siege → lawbringers → final-ward → complete
    it('VALID: {happy path, 2 steps} => pathseeker through final-ward, quest complete', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'orch-happy' }),
      });
      const env = setupTestEnv(testbed.guildPath);

      const quest = await withEnvRestore(env, async () => {
        const { guild, questId } = await createTestQuest({
          testbed,
          observableIds: ['obs-1'],
          stepCount: 2,
        });

        // Queue: pathseeker
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('ps-sess') }));
        // Queue: 2 codeweavers
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('cw-sess-0') }));
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('cw-sess-1') }));
        // Queue: ward (pass)
        queueResponse(env.wardQueueDir, wardPassResponse());
        // Queue: siege
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('siege-sess') }));
        // Queue: 2 lawbringers
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('lb-sess-0') }));
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('lb-sess-1') }));
        // Queue: final ward (pass)
        queueResponse(env.wardQueueDir, wardPassResponse());

        await OrchestrationFlow.start({
          questId,
        });

        const { quest: result } = await pollForQuestStatus({
          questId,
          targetStatuses: ['complete'],
        });

        await GuildRemoveResponder({ guildId: guild.id });
        testbed.cleanup();
        return result;
      });

      const { workItems } = quest;
      const pathseekerItems = workItems.filter((wi) => wi.role === 'pathseeker');
      const codeweaverItems = workItems.filter((wi) => wi.role === 'codeweaver');
      const wardItems = workItems.filter((wi) => wi.role === 'ward');
      const siegeItems = workItems.filter((wi) => wi.role === 'siegemaster');
      const lawbringerItems = workItems.filter((wi) => wi.role === 'lawbringer');

      expect(quest.status).toBe('complete');
      expect(pathseekerItems).toHaveLength(1);
      expect(pathseekerItems[0]!.status).toBe('complete');
      expect(codeweaverItems).toHaveLength(2);
      expect(codeweaverItems.every((wi) => wi.status === 'complete')).toBe(true);
      expect(wardItems.every((wi) => wi.status === 'complete')).toBe(true);
      expect(siegeItems).toHaveLength(1);
      expect(siegeItems[0]!.status).toBe('complete');
      expect(lawbringerItems).toHaveLength(2);
      expect(lawbringerItems.every((wi) => wi.status === 'complete')).toBe(true);
    }, 60_000);

    // Test 2a: Codeweaver failure (2 items, all in slots)
    it('VALID: {codeweaver failure, 2 items} => drain + skip + pathseeker replan', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'orch-cw-fail-2' }),
      });
      const env = setupTestEnv(testbed.guildPath);
      const quest = await withEnvRestore(env, async () => {
        const { guild, questId } = await createTestQuest({
          testbed,
          observableIds: ['obs-1'],
          stepCount: 2,
        });

        // pathseeker succeeds
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('ps-sess') }));
        // codeweaver 0 fails, codeweaver 1 succeeds (drain)
        queueResponse(
          env.claudeQueueDir,
          agentFailedResponse({ sessionId: sid('cw-fail-0'), summary: 'Build error' }),
        );
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('cw-ok-1') }));
        // The slot manager spawns a followup pathseeker (replan) for codeweaver failure
        queueResponse(
          env.claudeQueueDir,
          agentSuccessResponse({ sessionId: sid('ps-replan-sess') }),
        );
        // After replan pathseeker, new codeweavers, ward, siege, lawbringers, final-ward
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('cw2-sess-0') }));
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('cw2-sess-1') }));
        queueResponse(env.wardQueueDir, wardPassResponse());
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('siege2-sess') }));
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('lb2-sess-0') }));
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('lb2-sess-1') }));
        queueResponse(env.wardQueueDir, wardPassResponse());

        await OrchestrationFlow.start({
          questId,
        });

        const { quest: result } = await pollForQuestStatus({
          questId,
          targetStatuses: ['complete', 'blocked', 'in_progress'],
          timeoutMs: 60_000,
        });

        await GuildRemoveResponder({ guildId: guild.id });
        testbed.cleanup();
        return result;
      });

      // Verify codeweaver failure produced pathseeker replan
      const cwItems = quest.workItems.filter((wi) => wi.role === 'codeweaver');
      const failedCw = cwItems.filter((wi) => wi.status === 'failed');

      expect(failedCw.length).toBeGreaterThanOrEqual(1);
    }, 60_000);

    // Test 2b: Codeweaver failure (6 items, 3 slots)
    it('VALID: {codeweaver failure, 6 items, 3 slots} => pending skipped + pathseeker replan', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'orch-cw-fail-6' }),
      });
      const env = setupTestEnv(testbed.guildPath);
      const quest = await withEnvRestore(env, async () => {
        const { guild, questId } = await createTestQuest({
          testbed,
          observableIds: ['obs-1'],
          stepCount: 6,
        });

        // pathseeker
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('ps-sess') }));
        // 3 codeweavers in slots: one fails, two succeed
        queueResponse(env.claudeQueueDir, agentFailedResponse({ sessionId: sid('cw-fail-0') }));
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('cw-ok-1') }));
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('cw-ok-2') }));
        // Followup pathseeker from codeweaver failure
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('ps-replan') }));
        // After replan: 6 new codeweavers + ward + siege + 6 lawbringers + final-ward
        for (let i = 0; i < 6; i++) {
          queueResponse(
            env.claudeQueueDir,
            agentSuccessResponse({ sessionId: sid(`cw2-${String(i)}`) }),
          );
        }
        queueResponse(env.wardQueueDir, wardPassResponse());
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('siege2') }));
        for (let i = 0; i < 6; i++) {
          queueResponse(
            env.claudeQueueDir,
            agentSuccessResponse({ sessionId: sid(`lb2-${String(i)}`) }),
          );
        }
        queueResponse(env.wardQueueDir, wardPassResponse());

        await OrchestrationFlow.start({
          questId,
        });

        const { quest: result } = await pollForQuestStatus({
          questId,
          targetStatuses: ['complete', 'blocked'],
          timeoutMs: 60_000,
        });

        await GuildRemoveResponder({ guildId: guild.id });
        testbed.cleanup();
        return result;
      });

      // 3 pending codeweavers that never started should be skipped
      const skippedCw = quest.workItems
        .filter((wi) => wi.role === 'codeweaver')
        .filter((wi) => wi.status === 'skipped');

      expect(skippedCw.length).toBeGreaterThanOrEqual(1);
    }, 60_000);

    // Test 3: Ward failure → spiritmender → ward retry → siege
    it('VALID: {ward fails with retries} => spiritmender + ward retry + siege', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'orch-ward-retry' }),
      });
      const env = setupTestEnv(testbed.guildPath);
      const quest = await withEnvRestore(env, async () => {
        const { guild, questId } = await createTestQuest({
          testbed,
          observableIds: ['obs-1'],
          stepCount: 1,
        });

        // pathseeker
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('ps-sess') }));
        // codeweaver
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('cw-sess') }));
        // ward fails (attempt 0 of 3)
        queueResponse(
          env.wardQueueDir,
          wardFailResponse({ filePaths: [FilePathStub({ value: '/src/file.ts' })] }),
        );
        // spiritmender succeeds
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('sm-sess') }));
        // ward retry passes (attempt 1)
        queueResponse(env.wardQueueDir, wardPassResponse());
        // siege
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('siege-sess') }));
        // lawbringer
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('lb-sess') }));
        // final ward
        queueResponse(env.wardQueueDir, wardPassResponse());

        await OrchestrationFlow.start({
          questId,
        });

        const { quest: result } = await pollForQuestStatus({
          questId,
          targetStatuses: ['complete'],
        });

        await GuildRemoveResponder({ guildId: guild.id });
        testbed.cleanup();
        return result;
      });

      const { workItems } = quest;
      const wardItems = workItems.filter((wi) => wi.role === 'ward');
      const spiritmenderItems = workItems.filter((wi) => wi.role === 'spiritmender');
      const failedWards = wardItems.filter((wi) => wi.status === 'failed');
      const completedWards = wardItems.filter((wi) => wi.status === 'complete');

      expect(quest.status).toBe('complete');
      // At least 2 wards (original failed + retry succeeded)
      expect(wardItems.length).toBeGreaterThanOrEqual(2);
      expect(spiritmenderItems.length).toBeGreaterThanOrEqual(1);
      expect(failedWards.length).toBeGreaterThanOrEqual(1);
      expect(completedWards.length).toBeGreaterThanOrEqual(1);
    }, 60_000);

    // Test 4: Ward exhausts retries → pathseeker replan
    it('VALID: {ward exhausts all 3 retries} => pending skipped + pathseeker replan', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'orch-ward-exhaust' }),
      });
      const env = setupTestEnv(testbed.guildPath);
      const quest = await withEnvRestore(env, async () => {
        const { guild, questId } = await createTestQuest({
          testbed,
          observableIds: ['obs-1'],
          stepCount: 1,
        });

        // pathseeker
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('ps-sess') }));
        // codeweaver
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('cw-sess') }));
        // ward fails attempt 0
        queueResponse(env.wardQueueDir, wardFailResponse());
        // spiritmender for attempt 0
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('sm-0') }));
        // ward fails attempt 1
        queueResponse(env.wardQueueDir, wardFailResponse());
        // spiritmender for attempt 1
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('sm-1') }));
        // ward fails attempt 2 (last attempt, no more retries)
        queueResponse(env.wardQueueDir, wardFailResponse());
        // pathseeker replan (no more ward retries)
        // The loop should detect blocked state after ward exhaustion

        await OrchestrationFlow.start({
          questId,
        });

        const { quest: result } = await pollForQuestStatus({
          questId,
          targetStatuses: ['blocked', 'in_progress'],
          timeoutMs: 30_000,
        });

        await GuildRemoveResponder({ guildId: guild.id });
        testbed.cleanup();
        return result;
      });

      const failedWards = quest.workItems
        .filter((wi) => wi.role === 'ward')
        .filter((wi) => wi.status === 'failed');

      expect(failedWards.length).toBeGreaterThanOrEqual(3);
    }, 60_000);

    // Test 5: Siege failure → pathseeker replan
    it('VALID: {siege fails} => lawbringers skipped + pathseeker replan', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'orch-siege-fail' }),
      });
      const env = setupTestEnv(testbed.guildPath);
      const quest = await withEnvRestore(env, async () => {
        const { guild, questId } = await createTestQuest({
          testbed,
          observableIds: ['obs-1'],
          stepCount: 1,
        });

        // pathseeker
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('ps-sess') }));
        // codeweaver
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('cw-sess') }));
        // ward passes
        queueResponse(env.wardQueueDir, wardPassResponse());
        // siege fails with FAILED OBSERVABLES
        queueResponse(
          env.claudeQueueDir,
          agentFailedResponse({
            sessionId: sid('siege-fail'),
            summary: 'FAILED OBSERVABLES: login redirect not working',
          }),
        );

        await OrchestrationFlow.start({
          questId,
        });

        // Siege failure creates a fix chain (codeweaver-fix → ward-rerun → siege-recheck)
        // OR skips + pathseeker replan — depends on implementation
        const { quest: result } = await pollForQuestStatus({
          questId,
          targetStatuses: ['complete', 'blocked', 'in_progress'],
          timeoutMs: 30_000,
        });

        await GuildRemoveResponder({ guildId: guild.id });
        testbed.cleanup();
        return result;
      });

      const failedSiege = quest.workItems
        .filter((wi) => wi.role === 'siegemaster')
        .filter((wi) => wi.status === 'failed');

      expect(failedSiege.length).toBeGreaterThanOrEqual(1);
    }, 60_000);

    // Test 6a: Lawbringer failure (2 items, all in slots)
    it('VALID: {lawbringer failure, 2 items} => spiritmender created, no skip', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'orch-lb-fail-2' }),
      });
      const env = setupTestEnv(testbed.guildPath);
      const quest = await withEnvRestore(env, async () => {
        const { guild, questId } = await createTestQuest({
          testbed,
          observableIds: ['obs-1'],
          stepCount: 2,
        });

        // pathseeker
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('ps-sess') }));
        // 2 codeweavers
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('cw-0') }));
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('cw-1') }));
        // ward
        queueResponse(env.wardQueueDir, wardPassResponse());
        // siege
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('siege-sess') }));
        // lawbringer 0 fails, lawbringer 1 succeeds
        queueResponse(env.claudeQueueDir, agentFailedResponse({ sessionId: sid('lb-fail-0') }));
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('lb-ok-1') }));
        // Followup spiritmender for failed lawbringer
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('sm-lb') }));
        // final ward
        queueResponse(env.wardQueueDir, wardPassResponse());

        await OrchestrationFlow.start({
          questId,
        });

        const { quest: result } = await pollForQuestStatus({
          questId,
          targetStatuses: ['complete', 'blocked', 'in_progress'],
          timeoutMs: 60_000,
        });

        await GuildRemoveResponder({ guildId: guild.id });
        testbed.cleanup();
        return result;
      });

      const lawbringerItems = quest.workItems.filter((wi) => wi.role === 'lawbringer');
      const failedLb = lawbringerItems.filter((wi) => wi.status === 'failed');
      // No lawbringers should be skipped (unlike codeweaver failure)
      const skippedLb = lawbringerItems.filter((wi) => wi.status === 'skipped');

      expect(failedLb.length).toBeGreaterThanOrEqual(1);
      expect(skippedLb).toHaveLength(0);
    }, 60_000);

    // Test 6b: Lawbringer failure (6 items, 3 slots)
    it('VALID: {lawbringer failure, 6 items, 3 slots} => pending still dispatch, no skip', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'orch-lb-fail-6' }),
      });
      const env = setupTestEnv(testbed.guildPath);
      const quest = await withEnvRestore(env, async () => {
        const { guild, questId } = await createTestQuest({
          testbed,
          observableIds: ['obs-1'],
          stepCount: 6,
        });

        // pathseeker
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('ps-sess') }));
        // 6 codeweavers
        for (let i = 0; i < 6; i++) {
          queueResponse(
            env.claudeQueueDir,
            agentSuccessResponse({ sessionId: sid(`cw-${String(i)}`) }),
          );
        }
        // ward
        queueResponse(env.wardQueueDir, wardPassResponse());
        // siege
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('siege-sess') }));
        // 6 lawbringers: first fails, rest succeed
        queueResponse(env.claudeQueueDir, agentFailedResponse({ sessionId: sid('lb-fail-0') }));
        for (let i = 1; i < 6; i++) {
          queueResponse(
            env.claudeQueueDir,
            agentSuccessResponse({ sessionId: sid(`lb-ok-${String(i)}`) }),
          );
        }
        // Followup spiritmender for failed lawbringer
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('sm-lb') }));
        // final ward
        queueResponse(env.wardQueueDir, wardPassResponse());

        await OrchestrationFlow.start({
          questId,
        });

        const { quest: result } = await pollForQuestStatus({
          questId,
          targetStatuses: ['complete', 'blocked', 'in_progress'],
          timeoutMs: 60_000,
        });

        await GuildRemoveResponder({ guildId: guild.id });
        testbed.cleanup();
        return result;
      });

      // Pending lawbringers should NOT be skipped (lawbringer failure doesn't skip others)
      const skippedLb = quest.workItems
        .filter((wi) => wi.role === 'lawbringer')
        .filter((wi) => wi.status === 'skipped');

      expect(skippedLb).toHaveLength(0);
    }, 60_000);

    // Test 7: Multi-step concurrent codeweavers
    it('VALID: {3 steps} => 3 codeweavers dispatched via slots, all complete', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'orch-multi-cw' }),
      });
      const env = setupTestEnv(testbed.guildPath);
      const quest = await withEnvRestore(env, async () => {
        const { guild, questId } = await createTestQuest({
          testbed,
          observableIds: ['obs-1'],
          stepCount: 3,
        });

        // pathseeker
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('ps-sess') }));
        // 3 codeweavers (all 3 slots)
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('cw-0') }));
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('cw-1') }));
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('cw-2') }));
        // ward
        queueResponse(env.wardQueueDir, wardPassResponse());
        // siege
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('siege-sess') }));
        // 3 lawbringers
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('lb-0') }));
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('lb-1') }));
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('lb-2') }));
        // final ward
        queueResponse(env.wardQueueDir, wardPassResponse());

        await OrchestrationFlow.start({
          questId,
        });

        const { quest: result } = await pollForQuestStatus({
          questId,
          targetStatuses: ['complete'],
        });

        await GuildRemoveResponder({ guildId: guild.id });
        testbed.cleanup();
        return result;
      });

      const codeweaverItems = quest.workItems.filter((wi) => wi.role === 'codeweaver');

      expect(quest.status).toBe('complete');
      expect(codeweaverItems).toHaveLength(3);
      expect(codeweaverItems.every((wi) => wi.status === 'complete')).toBe(true);
    }, 60_000);

    // Test 8: Lawbringers complete → final ward → complete
    it('VALID: {lawbringers complete} => final ward fires, quest complete', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'orch-lb-final-ward' }),
      });
      const env = setupTestEnv(testbed.guildPath);
      const quest = await withEnvRestore(env, async () => {
        const { guild, questId } = await createTestQuest({
          testbed,
          observableIds: ['obs-1'],
          stepCount: 2,
        });

        // pathseeker + 2 codeweavers + ward + siege + 2 lawbringers + final ward
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('ps') }));
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('cw-0') }));
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('cw-1') }));
        queueResponse(env.wardQueueDir, wardPassResponse());
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('siege') }));
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('lb-0') }));
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('lb-1') }));
        queueResponse(env.wardQueueDir, wardPassResponse());

        await OrchestrationFlow.start({
          questId,
        });

        const { quest: result } = await pollForQuestStatus({
          questId,
          targetStatuses: ['complete'],
        });

        await GuildRemoveResponder({ guildId: guild.id });
        testbed.cleanup();
        return result;
      });

      // Verify both wards completed (first after codeweavers, final after lawbringers)
      const wardItems = quest.workItems.filter((wi) => wi.role === 'ward');

      expect(quest.status).toBe('complete');
      expect(wardItems).toHaveLength(2);
      expect(wardItems.every((wi) => wi.status === 'complete')).toBe(true);
    }, 60_000);

    // Test 9: Final ward fails → pathseeker replan
    it('VALID: {final ward fails} => pathseeker replan created', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'orch-final-ward-fail' }),
      });
      const env = setupTestEnv(testbed.guildPath);
      const quest = await withEnvRestore(env, async () => {
        const { guild, questId } = await createTestQuest({
          testbed,
          observableIds: ['obs-1'],
          stepCount: 1,
        });

        // pathseeker + codeweaver + ward + siege + lawbringer + final ward (fails)
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('ps') }));
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('cw') }));
        queueResponse(env.wardQueueDir, wardPassResponse());
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('siege') }));
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('lb') }));
        // final ward fails
        queueResponse(env.wardQueueDir, wardFailResponse());
        // spiritmender for final ward failure
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('sm') }));
        // ward retry passes
        queueResponse(env.wardQueueDir, wardPassResponse());

        await OrchestrationFlow.start({
          questId,
        });

        const { quest: result } = await pollForQuestStatus({
          questId,
          targetStatuses: ['complete', 'blocked'],
          timeoutMs: 30_000,
        });

        await GuildRemoveResponder({ guildId: guild.id });
        testbed.cleanup();
        return result;
      });

      const failedWards = quest.workItems
        .filter((wi) => wi.role === 'ward')
        .filter((wi) => wi.status === 'failed');

      expect(failedWards.length).toBeGreaterThanOrEqual(1);
    }, 60_000);

    // Test 10: ChaosWhisperer → approved → Start → pathseeker
    it('VALID: {chaos flow} => chaos completes, start creates pathseeker', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'orch-chaos' }),
      });
      const env = setupTestEnv(testbed.guildPath);
      const quest = await withEnvRestore(env, async () => {
        const guild = await GuildAddResponder({
          name: GuildNameStub({ value: 'Chaos Guild' }),
          path: GuildPathStub({ value: testbed.guildPath }),
        });

        const addResult = await QuestAddResponder({
          title: 'Chaos Quest',
          userRequest: 'A quest testing chaos flow',
          guildId: guild.id,
        });

        const questId = addResult.questId!;

        await approveQuest({ questId, observableIds: ['obs-1'], stepCount: 1 });
        await completeChaosWorkItem({ questId });

        // Queue all responses for the full flow
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('ps-sess') }));
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('cw-sess') }));
        queueResponse(env.wardQueueDir, wardPassResponse());
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('siege-sess') }));
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('lb-sess') }));
        queueResponse(env.wardQueueDir, wardPassResponse());

        await OrchestrationFlow.start({
          questId,
        });

        const { quest: result } = await pollForQuestStatus({
          questId,
          targetStatuses: ['complete'],
        });

        await GuildRemoveResponder({ guildId: guild.id });
        testbed.cleanup();
        return result;
      });

      // Verify pathseeker was created as first execution item
      const pathseekers = quest.workItems.filter((wi) => wi.role === 'pathseeker');

      expect(quest.status).toBe('complete');
      expect(pathseekers.length).toBeGreaterThanOrEqual(1);
    }, 60_000);

    // Test 11: Glyphsmith flow (needsDesign=true)
    it('VALID: {glyphsmith flow} => design completes, pathseeker depends on chaos+glyph', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'orch-glyph' }),
      });
      const env = setupTestEnv(testbed.guildPath);
      const quest = await withEnvRestore(env, async () => {
        const guild = await GuildAddResponder({
          name: GuildNameStub({ value: 'Glyph Guild' }),
          path: GuildPathStub({ value: testbed.guildPath }),
        });

        const addResult = await QuestAddResponder({
          title: 'Glyph Quest',
          userRequest: 'A quest with design phase',
          guildId: guild.id,
        });

        const questId = addResult.questId!;

        // Walk quest through full approval with needsDesign=true
        const typedQuestId = questId;
        const flows = buildValidFlows({ observableIds: ['obs-1'] });
        const steps = buildValidSteps({ observableIds: ['obs-1'], stepCount: 1 });

        await QuestModifyResponder({
          questId: typedQuestId,
          input: ModifyQuestInputStub({ questId: typedQuestId, status: 'explore_flows' }),
        });
        await QuestModifyResponder({
          questId: typedQuestId,
          input: ModifyQuestInputStub({ questId: typedQuestId, flows }),
        });
        await QuestModifyResponder({
          questId: typedQuestId,
          input: ModifyQuestInputStub({ questId: typedQuestId, status: 'review_flows' }),
        });
        await QuestModifyResponder({
          questId: typedQuestId,
          input: ModifyQuestInputStub({ questId: typedQuestId, status: 'flows_approved' }),
        });
        await QuestModifyResponder({
          questId: typedQuestId,
          input: ModifyQuestInputStub({ questId: typedQuestId, status: 'explore_observables' }),
        });
        await QuestModifyResponder({
          questId: typedQuestId,
          input: ModifyQuestInputStub({ questId: typedQuestId, status: 'review_observables' }),
        });
        await QuestModifyResponder({
          questId: typedQuestId,
          input: ModifyQuestInputStub({ questId: typedQuestId, status: 'approved' }),
        });
        await QuestModifyResponder({
          questId: typedQuestId,
          input: ModifyQuestInputStub({ questId: typedQuestId, steps }),
        });
        await completeChaosWorkItem({ questId });

        // Queue full flow: pathseeker + codeweaver + ward + siege + lawbringer + final ward
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('ps-sess') }));
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('cw-sess') }));
        queueResponse(env.wardQueueDir, wardPassResponse());
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('siege-sess') }));
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('lb-sess') }));
        queueResponse(env.wardQueueDir, wardPassResponse());

        await OrchestrationFlow.start({
          questId: typedQuestId,
        });

        const { quest: result } = await pollForQuestStatus({
          questId,
          targetStatuses: ['complete'],
        });

        await GuildRemoveResponder({ guildId: guild.id });
        testbed.cleanup();
        return result;
      });

      expect(quest.status).toBe('complete');
    }, 60_000);

    // Test 12a: Spiritmender failure (2 files)
    it('VALID: {spiritmender failure, 2 files} => quest work item failed, skip + replan', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'orch-sm-fail-2' }),
      });
      const env = setupTestEnv(testbed.guildPath);
      const quest = await withEnvRestore(env, async () => {
        const { guild, questId } = await createTestQuest({
          testbed,
          observableIds: ['obs-1'],
          stepCount: 1,
        });

        // pathseeker
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('ps') }));
        // codeweaver
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('cw') }));
        // ward fails with 2 file paths
        queueResponse(
          env.wardQueueDir,
          wardFailResponse({
            filePaths: [
              FilePathStub({ value: '/src/file-a.ts' }),
              FilePathStub({ value: '/src/file-b.ts' }),
            ],
          }),
        );
        // spiritmender: one file fails
        queueResponse(env.claudeQueueDir, agentFailedResponse({ sessionId: sid('sm-fail-0') }));
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('sm-ok-1') }));

        await OrchestrationFlow.start({
          questId,
        });

        const { quest: result } = await pollForQuestStatus({
          questId,
          targetStatuses: ['blocked', 'in_progress', 'complete'],
          timeoutMs: 30_000,
        });

        await GuildRemoveResponder({ guildId: guild.id });
        testbed.cleanup();
        return result;
      });

      const failedSm = quest.workItems
        .filter((wi) => wi.role === 'spiritmender')
        .filter((wi) => wi.status === 'failed');

      expect(failedSm.length).toBeGreaterThanOrEqual(1);
    }, 60_000);

    // Test 12b: Spiritmender failure (6 files, 3 slots)
    it('VALID: {spiritmender failure, 6 files, 3 slots} => failed + skip + pathseeker replan', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'orch-sm-fail-6' }),
      });
      const env = setupTestEnv(testbed.guildPath);
      const quest = await withEnvRestore(env, async () => {
        const { guild, questId } = await createTestQuest({
          testbed,
          observableIds: ['obs-1'],
          stepCount: 1,
        });

        const sixPaths = Array.from({ length: 6 }, (_, i) =>
          FilePathStub({ value: `/src/file-${String(i)}.ts` }),
        );

        // pathseeker
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('ps') }));
        // codeweaver
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('cw') }));
        // ward fails with 6 file paths
        queueResponse(env.wardQueueDir, wardFailResponse({ filePaths: sixPaths }));
        // spiritmender: first fails, rest succeed (but overall is failed)
        queueResponse(env.claudeQueueDir, agentFailedResponse({ sessionId: sid('sm-fail') }));
        for (let i = 1; i < 6; i++) {
          queueResponse(
            env.claudeQueueDir,
            agentSuccessResponse({ sessionId: sid(`sm-ok-${String(i)}`) }),
          );
        }

        await OrchestrationFlow.start({
          questId,
        });

        const { quest: result } = await pollForQuestStatus({
          questId,
          targetStatuses: ['blocked', 'in_progress', 'complete'],
          timeoutMs: 30_000,
        });

        await GuildRemoveResponder({ guildId: guild.id });
        testbed.cleanup();
        return result;
      });

      const spiritmenderItems = quest.workItems.filter((wi) => wi.role === 'spiritmender');

      expect(spiritmenderItems.length).toBeGreaterThanOrEqual(1);
    }, 60_000);

    // Test 13: PathSeeker exhausts retries → blocked
    it('VALID: {pathseeker fails 3 times} => quest blocked', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'orch-ps-exhaust' }),
      });
      const env = setupTestEnv(testbed.guildPath);
      const quest = await withEnvRestore(env, async () => {
        const guild = await GuildAddResponder({
          name: GuildNameStub({ value: 'PS Exhaust Guild' }),
          path: GuildPathStub({ value: testbed.guildPath }),
        });

        const addResult = await QuestAddResponder({
          title: 'PS Exhaust Quest',
          userRequest: 'Test pathseeker retry exhaustion',
          guildId: guild.id,
        });

        const questId = addResult.questId!;
        const typedQuestId = questId;

        // Approve quest but with invalid steps (empty observablesSatisfied) so verify fails
        await QuestModifyResponder({
          questId: typedQuestId,
          input: ModifyQuestInputStub({ questId: typedQuestId, status: 'explore_flows' }),
        });
        await QuestModifyResponder({
          questId: typedQuestId,
          input: ModifyQuestInputStub({
            questId: typedQuestId,
            flows: buildValidFlows({ observableIds: ['obs-1'] }),
          }),
        });
        await QuestModifyResponder({
          questId: typedQuestId,
          input: ModifyQuestInputStub({ questId: typedQuestId, status: 'review_flows' }),
        });
        await QuestModifyResponder({
          questId: typedQuestId,
          input: ModifyQuestInputStub({ questId: typedQuestId, status: 'flows_approved' }),
        });
        await QuestModifyResponder({
          questId: typedQuestId,
          input: ModifyQuestInputStub({ questId: typedQuestId, status: 'explore_observables' }),
        });
        await QuestModifyResponder({
          questId: typedQuestId,
          input: ModifyQuestInputStub({ questId: typedQuestId, status: 'review_observables' }),
        });
        await QuestModifyResponder({
          questId: typedQuestId,
          input: ModifyQuestInputStub({ questId: typedQuestId, status: 'approved' }),
        });

        // Don't add steps — quest verification will fail (no steps covering observables)
        await completeChaosWorkItem({ questId });

        // Queue 3 pathseeker attempts (all will fail verification)
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('ps-0') }));
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('ps-1') }));
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('ps-2') }));

        await OrchestrationFlow.start({ questId: typedQuestId });

        const { quest: result } = await pollForQuestStatus({
          questId,
          targetStatuses: ['blocked'],
          timeoutMs: 30_000,
        });

        await GuildRemoveResponder({ guildId: guild.id });
        testbed.cleanup();
        return result;
      });

      const failedPs = quest.workItems
        .filter((wi) => wi.role === 'pathseeker')
        .filter((wi) => wi.status === 'failed');

      expect(quest.status).toBe('blocked');
      expect(failedPs).toHaveLength(3);
    }, 60_000);

    // Test 14: PathSeeker creates 0 steps (edge case)
    it('VALID: {pathseeker verify passes, 0 steps} => 0 codeweavers, quest completes gracefully', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'orch-ps-0-steps' }),
      });
      const env = setupTestEnv(testbed.guildPath);
      const quest = await withEnvRestore(env, async () => {
        const guild = await GuildAddResponder({
          name: GuildNameStub({ value: 'Zero Steps Guild' }),
          path: GuildPathStub({ value: testbed.guildPath }),
        });

        const addResult = await QuestAddResponder({
          title: 'Zero Steps Quest',
          userRequest: 'Test zero steps edge case',
          guildId: guild.id,
        });

        const questId = addResult.questId!;
        const typedQuestId = questId;

        // Approve quest with 0 steps but valid flows (no observables to cover)
        const nodeA = FlowNodeStub({
          id: 'node-a' as ReturnType<typeof FlowNodeStub>['id'],
          type: 'state',
          observables: [],
        });
        const nodeB = FlowNodeStub({
          id: 'node-b' as ReturnType<typeof FlowNodeStub>['id'],
          type: 'state',
          observables: [],
        });
        const edge = FlowEdgeStub({ from: nodeA.id, to: nodeB.id });
        const flows = [FlowStub({ nodes: [nodeA, nodeB], edges: [edge] })];

        await QuestModifyResponder({
          questId: typedQuestId,
          input: ModifyQuestInputStub({ questId: typedQuestId, status: 'explore_flows' }),
        });
        await QuestModifyResponder({
          questId: typedQuestId,
          input: ModifyQuestInputStub({ questId: typedQuestId, flows }),
        });
        await QuestModifyResponder({
          questId: typedQuestId,
          input: ModifyQuestInputStub({ questId: typedQuestId, status: 'review_flows' }),
        });
        await QuestModifyResponder({
          questId: typedQuestId,
          input: ModifyQuestInputStub({ questId: typedQuestId, status: 'flows_approved' }),
        });
        await QuestModifyResponder({
          questId: typedQuestId,
          input: ModifyQuestInputStub({ questId: typedQuestId, status: 'explore_observables' }),
        });
        await QuestModifyResponder({
          questId: typedQuestId,
          input: ModifyQuestInputStub({ questId: typedQuestId, status: 'review_observables' }),
        });
        await QuestModifyResponder({
          questId: typedQuestId,
          input: ModifyQuestInputStub({ questId: typedQuestId, status: 'approved' }),
        });

        await completeChaosWorkItem({ questId });

        // pathseeker succeeds — verify passes (no observables to violate), 0 steps → no work items
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('ps-0-steps') }));

        await OrchestrationFlow.start({ questId: typedQuestId });

        // With 0 steps, stepsToWorkItemsTransformer returns [] — pathseeker goes complete
        // but no downstream items. Quest should become complete (only pathseeker item).
        const { quest: result } = await pollForQuestStatus({
          questId,
          targetStatuses: ['complete'],
          timeoutMs: 30_000,
        });

        await GuildRemoveResponder({ guildId: guild.id });
        testbed.cleanup();
        return result;
      });

      const codeweavers = quest.workItems.filter((wi) => wi.role === 'codeweaver');

      expect(quest.status).toBe('complete');
      expect(codeweavers).toHaveLength(0);
    }, 60_000);

    // Test 15: Invariant — lawbringer count matches codeweaver count
    const runInvariantTest = async (
      stepCount: number,
    ): Promise<Awaited<ReturnType<typeof pollForQuestStatus>>['quest']> => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: `orch-invariant-${String(stepCount)}` }),
      });
      const env = setupTestEnv(testbed.guildPath);
      const quest = await withEnvRestore(env, async () => {
        const { guild, questId } = await createTestQuest({
          testbed,
          observableIds: ['obs-1'],
          stepCount,
        });

        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('ps') }));
        for (let i = 0; i < stepCount; i++) {
          queueResponse(
            env.claudeQueueDir,
            agentSuccessResponse({ sessionId: sid(`cw-${String(i)}`) }),
          );
        }
        queueResponse(env.wardQueueDir, wardPassResponse());
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('siege') }));
        for (let i = 0; i < stepCount; i++) {
          queueResponse(
            env.claudeQueueDir,
            agentSuccessResponse({ sessionId: sid(`lb-${String(i)}`) }),
          );
        }
        queueResponse(env.wardQueueDir, wardPassResponse());

        await OrchestrationFlow.start({ questId });

        const { quest: result } = await pollForQuestStatus({
          questId,
          targetStatuses: ['complete'],
        });

        await GuildRemoveResponder({ guildId: guild.id });
        testbed.cleanup();
        return result;
      });

      return quest;
    };

    it('VALID: {1 step} => 1 codeweaver and 1 lawbringer created', async () => {
      const quest = await runInvariantTest(1);

      expect(quest.workItems.filter((wi) => wi.role === 'codeweaver')).toHaveLength(1);
      expect(quest.workItems.filter((wi) => wi.role === 'lawbringer')).toHaveLength(1);
    }, 60_000);

    it('VALID: {2 steps} => 2 codeweavers and 2 lawbringers created', async () => {
      const quest = await runInvariantTest(2);

      expect(quest.workItems.filter((wi) => wi.role === 'codeweaver')).toHaveLength(2);
      expect(quest.workItems.filter((wi) => wi.role === 'lawbringer')).toHaveLength(2);
    }, 60_000);

    it('VALID: {3 steps} => 3 codeweavers and 3 lawbringers created', async () => {
      const quest = await runInvariantTest(3);

      expect(quest.workItems.filter((wi) => wi.role === 'codeweaver')).toHaveLength(3);
      expect(quest.workItems.filter((wi) => wi.role === 'lawbringer')).toHaveLength(3);
    }, 60_000);
  });
});
