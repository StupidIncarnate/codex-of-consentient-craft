import * as fs from 'fs';
import * as path from 'path';

import { installTestbedCreateBroker, BaseNameStub } from '@dungeonmaster/testing';
import { environmentStatics } from '@dungeonmaster/shared/statics';
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
  exitCode = ExitCodeStub({ value: 0 }),
}: {
  sessionId?: ClaudeQueueResponse['sessionId'];
  summary?: Parameters<typeof signalBackLine>[0]['summary'];
  exitCode?: ReturnType<typeof ExitCodeStub>;
} = {}): ClaudeQueueResponse => ({
  sessionId,
  exitCode,
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
// Poll helpers
// ---------------------------------------------------------------------------

const pollForQuestStatus = async ({
  questId,
  targetStatuses,
}: {
  questId: string;
  targetStatuses: string[];
}): Promise<{ quest: NonNullable<Awaited<ReturnType<typeof QuestGetResponder>>['quest']> }> => {
  const typedId = questId as ReturnType<typeof QuestIdStub>;

  type QuestType = NonNullable<Awaited<ReturnType<typeof QuestGetResponder>>['quest']>;

  const poll = async (): Promise<{
    quest: QuestType;
  }> =>
    QuestGetResponder({ questId: typedId }).then(async (result) => {
      if (result.success && result.quest && targetStatuses.includes(result.quest.status)) {
        return { quest: result.quest };
      }
      return new Promise<{ quest: QuestType }>((resolve) => {
        setTimeout(() => {
          resolve(poll());
        }, POLL_INTERVAL_MS);
      });
    });

  return poll();
};

/**
 * Polls until all work items have reached a terminal status (complete, failed, skipped).
 * Useful when the quest status itself may not change (e.g. stays in_progress)
 * but the orchestration loop has finished processing all items.
 */
const TERMINAL_STATUSES = new Set(['complete', 'failed', 'skipped']);

const pollUntilWorkItemsSettled = async ({
  questId,
  minItems = 1,
}: {
  questId: string;
  minItems?: number;
}): Promise<{ quest: NonNullable<Awaited<ReturnType<typeof QuestGetResponder>>['quest']> }> => {
  const typedId = questId as ReturnType<typeof QuestIdStub>;

  type QuestType = NonNullable<Awaited<ReturnType<typeof QuestGetResponder>>['quest']>;

  const poll = async (): Promise<{ quest: QuestType }> =>
    QuestGetResponder({ questId: typedId }).then(async (result) => {
      if (result.success && result.quest) {
        const allSettled = result.quest.workItems.every((wi) => TERMINAL_STATUSES.has(wi.status));
        if (allSettled && result.quest.workItems.length >= minItems) {
          return { quest: result.quest };
        }
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
  const savedDungeonmasterHome = process.env.DUNGEONMASTER_HOME;

  process.env.CLAUDE_CLI_PATH = FAKE_CLAUDE_CLI;
  process.env.FAKE_CLAUDE_QUEUE_DIR = String(claudeQueueDir);
  process.env.FAKE_WARD_QUEUE_DIR = String(wardQueueDir);
  process.env.PATH = `${FAKE_WARD_BIN_DIR}:${process.env.PATH ?? ''}`;
  // Isolate guild config to this test's temp directory instead of the real ~/.dungeonmaster.
  // Without this, all tests share the same config file and concurrent writes corrupt it.
  process.env.DUNGEONMASTER_HOME = tempDir;
  // Pre-create the .dungeonmaster directory and empty config so guildConfigReadBroker finds it
  const dmDir = path.join(tempDir, environmentStatics.testDataDir);
  fs.mkdirSync(dmDir, { recursive: true });
  fs.writeFileSync(path.join(dmDir, 'config.json'), JSON.stringify({ guilds: [] }));

  const restore = (): void => {
    process.env.CLAUDE_CLI_PATH = savedClaudeCliPath;
    process.env.FAKE_CLAUDE_QUEUE_DIR = savedFakeClaudeQueueDir;
    process.env.FAKE_WARD_QUEUE_DIR = savedFakeWardQueueDir;
    process.env.PATH = savedPath;
    if (savedDungeonmasterHome === undefined) {
      Reflect.deleteProperty(process.env, 'DUNGEONMASTER_HOME');
    } else {
      process.env.DUNGEONMASTER_HOME = savedDungeonmasterHome;
    }
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
    // Kill any background orchestration loops before restoring env vars.
    // Without this, fire-and-forget loops from OrchestrationFlow.start() may
    // outlive the test and consume queue files belonging to the next test.
    OrchestrationFlow.stopAll();
    // Brief pause to let abort signal propagate through pending async operations
    // before restoring env vars (prevents subsequent tests from inheriting stale state).
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 250);
    });
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
    const coveredObs = observableIds.map((id) => ObservableIdStub({ value: id }));
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

  // Verify steps are persisted before starting orchestration.
  // Without this read-back, a race condition can cause pathseeker to see 0 steps.
  const typedQuestId = questId;
  const readBack = await QuestGetResponder({ questId: typedQuestId });
  if (readBack.quest && readBack.quest.steps.length !== stepCount) {
    throw new Error(
      `Steps not persisted: expected ${String(stepCount)}, got ${String(readBack.quest.steps.length)}`,
    );
  }

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
      process.env.DUNGEONMASTER_HOME = testbed.guildPath;
      const dmDir1 = path.join(testbed.guildPath, environmentStatics.testDataDir);
      fs.mkdirSync(dmDir1, { recursive: true });
      fs.writeFileSync(path.join(dmDir1, 'config.json'), JSON.stringify({ guilds: [] }));

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
      Reflect.deleteProperty(process.env, 'DUNGEONMASTER_HOME');
      testbed.cleanup();

      expect(addResult.questId).toBeDefined();
    });

    it('VALID: {approved quest} => start returns processId and getStatus returns idle orchestration status', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'orchestration-approved' }),
      });
      process.env.DUNGEONMASTER_HOME = testbed.guildPath;
      const dmDir2 = path.join(testbed.guildPath, environmentStatics.testDataDir);
      fs.mkdirSync(dmDir2, { recursive: true });
      fs.writeFileSync(path.join(dmDir2, 'config.json'), JSON.stringify({ guilds: [] }));

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

      // Call getStatus immediately — before any await that would yield to the
      // fire-and-forget loop and allow it to finish + deregister the process.
      const status = OrchestrationFlow.getStatus({ processId });

      const questResult = await QuestGetResponder({ questId });

      OrchestrationFlow.stopAll();
      await GuildRemoveResponder({ guildId: guild.id });
      Reflect.deleteProperty(process.env, 'DUNGEONMASTER_HOME');
      testbed.cleanup();

      expect(processId).toMatch(/^proc-/u);
      expect(status.questId).toBe(questId);
      expect(questResult.success).toBe(true);
      expect(questResult.quest!.status).toBe('in_progress');
    });
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
      expect(pathseekerItems[0]?.status).toBe('complete');
      expect(codeweaverItems[0]?.status).toBe('complete');
      expect(codeweaverItems[1]?.status).toBe('complete');
      expect(wardItems[0]?.status).toBe('complete');
      expect(wardItems[1]?.status).toBe('complete');
      expect(siegeItems[0]?.status).toBe('complete');
      expect(lawbringerItems[0]?.status).toBe('complete');
      expect(lawbringerItems[1]?.status).toBe('complete');
    });

    // Test 2a: Codeweaver failure (2 items, all in slots)
    // With 'failed' in SATISFIED_STATUSES and onFollowupCreated persisting recovery items,
    // the codeweaver failure triggers a pathseeker replan inside the slot manager.
    // The onFollowupCreated callback persists the replan to quest.json (fire-and-forget).
    // Since the callback write races with the result-mapping write, the pathseeker replan
    // may or may not appear at quest level. Either way, downstream items proceed because
    // 'failed' is a satisfied status.
    //
    // Queue enough responses for both race outcomes:
    // - If replan persists as 'complete': ward → siege → lawbringers → final-ward
    // - If replan persists as 'pending' and runs: pathseeker → new codeweavers → ward → ...
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
        // With 'failed' in SATISFIED_STATUSES, downstream items become ready.
        // Extra pathseeker response in case replan runs at quest level (race condition).
        queueResponse(
          env.claudeQueueDir,
          agentSuccessResponse({ sessionId: sid('ps-replan-quest') }),
        );
        // Codeweavers (may be from original or replan path)
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('cw2-0') }));
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('cw2-1') }));
        // ward
        queueResponse(env.wardQueueDir, wardPassResponse());
        // siege
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('siege-sess') }));
        // 2 lawbringers
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('lb-sess-0') }));
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('lb-sess-1') }));
        // final ward
        queueResponse(env.wardQueueDir, wardPassResponse());

        await OrchestrationFlow.start({
          questId,
        });

        // All items settle: chaos(complete) + pathseeker(complete) + 2 codeweavers
        // + ward + siege + 2 lawbringers + final ward + pathseeker replan = ~10 items.
        // Quest stays in_progress (failed codeweaver prevents 'complete' status).
        const { quest: result } = await pollUntilWorkItemsSettled({
          questId,
          minItems: 8,
        });

        await GuildRemoveResponder({ guildId: guild.id });
        testbed.cleanup();
        return result;
      });

      // Codeweaver failure inside slot manager: one cw failed, one complete.
      // With 'failed' in SATISFIED_STATUSES, downstream items proceed.
      // Pathseeker replan was persisted by onFollowupCreated callback.
      const cwItems = quest.workItems.filter((wi) => wi.role === 'codeweaver');
      const failedCw = cwItems.filter((wi) => wi.status === 'failed');
      const wardItems = quest.workItems.filter((wi) => wi.role === 'ward');
      const pathseekerItems = quest.workItems.filter((wi) => wi.role === 'pathseeker');

      expect(failedCw.length).toBeGreaterThanOrEqual(1);
      expect(cwItems).toHaveLength(2);
      // Downstream items completed (ward + final ward)
      expect(wardItems.length).toBeGreaterThanOrEqual(2);
      expect(wardItems.every((wi) => wi.status === 'complete')).toBe(true);
      // Pathseeker replan persisted by callback
      expect(pathseekerItems.length).toBeGreaterThanOrEqual(2);
    });

    // Test 2b: Codeweaver failure (6 items, 3 slots)
    // With 'failed' in SATISFIED_STATUSES and onFollowupCreated persisting recovery items,
    // downstream items become ready after codeweaver failure (failed deps are satisfied).
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
        // With 'failed' in SATISFIED_STATUSES, downstream items become ready.
        // Ward (depends on codeweavers — some failed, rest complete = all satisfied) runs next.
        queueResponse(env.wardQueueDir, wardPassResponse());
        // siege
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('siege-sess') }));
        // 6 lawbringers
        for (let i = 0; i < 6; i++) {
          queueResponse(
            env.claudeQueueDir,
            agentSuccessResponse({ sessionId: sid(`lb-${String(i)}`) }),
          );
        }
        // final ward
        queueResponse(env.wardQueueDir, wardPassResponse());

        await OrchestrationFlow.start({
          questId,
        });

        const { quest: result } = await pollUntilWorkItemsSettled({
          questId,
          minItems: 6,
        });

        await GuildRemoveResponder({ guildId: guild.id });
        testbed.cleanup();
        return result;
      });

      // Codeweaver failure inside the slot manager marks the failed item as 'failed' at quest level.
      // Pending slot-manager items get skipped internally but are mapped to 'complete' at quest level
      // (the layer broker only distinguishes failed vs non-failed).
      // With 'failed' in SATISFIED_STATUSES, downstream items proceed.
      const cwItems = quest.workItems.filter((wi) => wi.role === 'codeweaver');
      const failedCw = cwItems.filter((wi) => wi.status === 'failed');
      const pathseekerItems = quest.workItems.filter((wi) => wi.role === 'pathseeker');

      expect(failedCw.length).toBeGreaterThanOrEqual(1);
      expect(cwItems).toHaveLength(6);
      // Pathseeker replan was persisted by onFollowupCreated callback
      expect(pathseekerItems.length).toBeGreaterThanOrEqual(1);
    });

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
        // ward fails (attempt 0 of 3) — runWardLayerBroker creates spiritmender + ward retry
        queueResponse(
          env.wardQueueDir,
          wardFailResponse({ filePaths: [FilePathStub({ value: '/src/file.ts' })] }),
        );
        // spiritmender succeeds (fixes ward errors)
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('sm-sess') }));
        // ward retry passes (attempt 1) — siege depends on this ward
        queueResponse(env.wardQueueDir, wardPassResponse());
        // siege
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('siege-sess') }));
        // lawbringer (1 step = 1 lawbringer)
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('lb-sess') }));
        // final ward (after lawbringers)
        queueResponse(env.wardQueueDir, wardPassResponse());

        await OrchestrationFlow.start({
          questId,
        });

        // Ward failure leaves a 'failed' work item. workItemsToQuestStatusTransformer
        // doesn't transition to 'complete' when any item is failed, so quest stays
        // 'in_progress'. Poll until all work items settle instead.
        const { quest: result } = await pollUntilWorkItemsSettled({
          questId,

          // chaos + ps + cw + ward(fail) + spiritmender + wardRetry + siege + lb + finalWard
          minItems: 9,
        });

        await GuildRemoveResponder({ guildId: guild.id });
        testbed.cleanup();
        return result;
      });

      const { workItems } = quest;
      const wardItems = workItems.filter((wi) => wi.role === 'ward');
      const spiritmenderItems = workItems.filter((wi) => wi.role === 'spiritmender');
      const siegeItems = workItems.filter((wi) => wi.role === 'siegemaster');

      // Quest stays in_progress because the original ward is 'failed'.
      // workItemsToQuestStatusTransformer requires ALL items complete/skipped for 'complete'.
      expect(wardItems).toHaveLength(3);
      expect(spiritmenderItems).toHaveLength(1);
      expect(wardItems.filter((wi) => wi.status === 'failed')).toHaveLength(1);
      expect(wardItems.filter((wi) => wi.status === 'complete')).toHaveLength(2);
      expect(siegeItems.some((wi) => wi.status === 'complete')).toBe(true);
    });

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
        // ward fails attempt 0 — runWardLayerBroker creates spiritmender + ward retry
        // (no filePaths in wardFailResponse, but broker falls back to quest steps)
        queueResponse(env.wardQueueDir, wardFailResponse());
        // spiritmender for attempt 0
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('sm-0') }));
        // ward fails attempt 1 — creates spiritmender + ward retry
        queueResponse(env.wardQueueDir, wardFailResponse());
        // spiritmender for attempt 1
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('sm-1') }));
        // ward fails attempt 2 (attempt >= maxAttempts-1 = 2): retries exhausted.
        // runWardLayerBroker skips pending items and creates pathseeker replan.
        queueResponse(env.wardQueueDir, wardFailResponse());
        // Pathseeker replan runs (verify passes since steps exist) — creates new work items.
        // Those new agents will crash (empty queue) and eventually the quest blocks.
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('ps-replan') }));

        await OrchestrationFlow.start({
          questId,
        });

        // Quest will eventually reach 'blocked' after new codeweavers exhaust crash retries
        const { quest: result } = await pollForQuestStatus({
          questId,
          targetStatuses: ['blocked'],
        });

        await GuildRemoveResponder({ guildId: guild.id });
        testbed.cleanup();
        return result;
      });

      const failedWards = quest.workItems
        .filter((wi) => wi.role === 'ward')
        .filter((wi) => wi.status === 'failed');
      const skippedItems = quest.workItems.filter((wi) => wi.status === 'skipped');
      const pathseekers = quest.workItems.filter((wi) => wi.role === 'pathseeker');

      // 3 original ward failures (attempts 0, 1, 2), pending items skipped, pathseeker replan
      expect(quest.status).toBe('blocked');
      expect(failedWards.length).toBeGreaterThanOrEqual(3);
      expect(skippedItems.length).toBeGreaterThanOrEqual(1);
      expect(pathseekers.length).toBeGreaterThanOrEqual(2);
    });

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
        // siege fails — runSiegemasterLayerBroker marks siege failed, skips pending lawbringers,
        // and creates a pathseeker replan as a new quest work item.
        queueResponse(
          env.claudeQueueDir,
          agentFailedResponse({
            sessionId: sid('siege-fail'),
            summary: 'FAILED OBSERVABLES: login redirect not working',
          }),
        );
        // Pathseeker replan runs (verify passes) and creates new work items.
        // Those crash (empty queue) → quest eventually reaches blocked.
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('ps-replan') }));

        await OrchestrationFlow.start({
          questId,
        });

        const { quest: result } = await pollForQuestStatus({
          questId,
          targetStatuses: ['blocked'],
        });

        await GuildRemoveResponder({ guildId: guild.id });
        testbed.cleanup();
        return result;
      });

      const failedSiege = quest.workItems
        .filter((wi) => wi.role === 'siegemaster')
        .filter((wi) => wi.status === 'failed');
      const skippedLawbringers = quest.workItems
        .filter((wi) => wi.role === 'lawbringer')
        .filter((wi) => wi.status === 'skipped');
      const pathseekers = quest.workItems.filter((wi) => wi.role === 'pathseeker');

      expect(failedSiege.length).toBeGreaterThanOrEqual(1);
      expect(skippedLawbringers.length).toBeGreaterThanOrEqual(1);
      expect(pathseekers.length).toBeGreaterThanOrEqual(2);
    });

    // Test 6a: Lawbringer failure (2 items, all in slots)
    // Lawbringer failure inside the slot manager spawns a spiritmender followup internally.
    // At the quest level, the failed lawbringer is marked 'failed'. The quest may not transition
    // status (stays 'in_progress') since workItemsToQuestStatusTransformer doesn't map
    // all-terminal-with-failures to 'blocked' when there are no pending items.
    it('VALID: {lawbringer failure, 2 items} => failed lawbringer at quest level', async () => {
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
        // Slot manager dispatches lb-0 first (sequential). lb-0 fails → skipAllPending skips lb-1.
        // Followup spiritmender spawned (consumes next response). lb-1 never starts.
        queueResponse(env.claudeQueueDir, agentFailedResponse({ sessionId: sid('lb-fail-0') }));
        // Consumed by slot-manager's spiritmender followup (lb-1 was skipped internally)
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('sm-lb') }));

        await OrchestrationFlow.start({
          questId,
        });

        // With the final ward depending on lawbringer IDs, a lawbringer failure
        // leaves the final ward pending with unsatisfied deps → quest blocked.
        const { quest: result } = await pollForQuestStatus({
          questId,
          targetStatuses: ['blocked'],
        });

        await GuildRemoveResponder({ guildId: guild.id });
        testbed.cleanup();
        return result;
      });

      // Lawbringer failure inside the slot manager spawns spiritmender internally.
      // At quest level: lb-0 failed, lb-1 mapped to 'complete' (slot-internal skip).
      // Final ward pending with unsatisfied deps → quest blocked.
      const lawbringerItems = quest.workItems.filter((wi) => wi.role === 'lawbringer');
      const failedLb = lawbringerItems.filter((wi) => wi.status === 'failed');
      const completedLb = lawbringerItems.filter((wi) => wi.status === 'complete');

      expect(quest.status).toBe('blocked');
      expect(failedLb.length).toBeGreaterThanOrEqual(1);
      expect(completedLb.length).toBeGreaterThanOrEqual(1);
    });

    // Test 6b: Lawbringer failure (6 items, 3 slots)
    // With 6 lawbringers dispatched sequentially through the slot manager:
    // lb-0 fails → skipAllPending skips lb-1..5, spiritmender followup spawned.
    // At quest level: lb-0 failed, lb-1..5 marked 'complete' (layer broker maps non-failed as complete).
    it('VALID: {lawbringer failure, 6 items, 3 slots} => failed lawbringer at quest level', async () => {
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
        // 6 codeweavers (dispatched sequentially by slot manager)
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
        // lb-0 fails → skipAllPending skips remaining → spiritmender followup spawned
        queueResponse(env.claudeQueueDir, agentFailedResponse({ sessionId: sid('lb-fail-0') }));
        // Consumed by slot-manager's spiritmender followup
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('sm-lb') }));

        await OrchestrationFlow.start({
          questId,
        });

        // With the final ward depending on lawbringer IDs, a lawbringer failure
        // leaves the final ward pending with unsatisfied deps → quest blocked.
        const { quest: result } = await pollForQuestStatus({
          questId,
          targetStatuses: ['blocked'],
        });

        await GuildRemoveResponder({ guildId: guild.id });
        testbed.cleanup();
        return result;
      });

      const lawbringerItems = quest.workItems.filter((wi) => wi.role === 'lawbringer');
      const failedLb = lawbringerItems.filter((wi) => wi.status === 'failed');
      const completedLb = lawbringerItems.filter((wi) => wi.status === 'complete');

      // At the quest level, lb-0 is 'failed'. The rest are mapped to 'complete'
      // by the layer broker (slot-manager-internal skips are not visible at quest level).
      expect(quest.status).toBe('blocked');
      expect(failedLb.length).toBeGreaterThanOrEqual(1);
      expect(completedLb.length).toBeGreaterThanOrEqual(1);
    });

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
    });

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

      // stepsToWorkItemsTransformer creates 2 wards: one between codeweavers and siege,
      // and a final ward after lawbringers.
      const wardItems = quest.workItems.filter((wi) => wi.role === 'ward');

      expect(quest.status).toBe('complete');
      expect(wardItems).toHaveLength(2);
      expect(wardItems.every((wi) => wi.status === 'complete')).toBe(true);
    });

    // Test 9: Ward fails → spiritmender + retry → all items settle
    // The first ward (between codeweavers and siege) fails and is retried.
    // After lawbringers, the final ward also passes. Quest stays in_progress
    // because the original ward is 'failed' (status transformer requires ALL complete/skipped).
    it('VALID: {ward fails} => spiritmender + ward retry + all items settle', async () => {
      const testbed = installTestbedCreateBroker({
        baseName: BaseNameStub({ value: 'orch-ward-fail-retry' }),
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
        // ward fails (attempt 0) — creates spiritmender + ward retry
        queueResponse(
          env.wardQueueDir,
          wardFailResponse({ filePaths: [FilePathStub({ value: '/src/file.ts' })] }),
        );
        // spiritmender fixes the ward errors
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('sm') }));
        // ward retry passes (attempt 1)
        queueResponse(env.wardQueueDir, wardPassResponse());
        // siege (depends on ward retry)
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('siege') }));
        // lawbringer
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('lb') }));
        // final ward (after lawbringers)
        queueResponse(env.wardQueueDir, wardPassResponse());

        await OrchestrationFlow.start({
          questId,
        });

        // Ward failure leaves a 'failed' work item, preventing 'complete' status.
        // Poll until all work items settle instead.
        const { quest: result } = await pollUntilWorkItemsSettled({
          questId,

          // chaos + ps + cw + ward(fail) + spiritmender + wardRetry + siege + lb + finalWard
          minItems: 9,
        });

        await GuildRemoveResponder({ guildId: guild.id });
        testbed.cleanup();
        return result;
      });

      const wardItems = quest.workItems.filter((wi) => wi.role === 'ward');
      const spiritmenderItems = quest.workItems.filter((wi) => wi.role === 'spiritmender');

      // Original ward failed (attempt 0), retry succeeded (attempt 1), final ward passed
      expect(wardItems).toHaveLength(3);
      expect(wardItems.filter((wi) => wi.status === 'failed')).toHaveLength(1);
      expect(wardItems.filter((wi) => wi.status === 'complete')).toHaveLength(2);
      expect(spiritmenderItems.length).toBeGreaterThanOrEqual(1);
    });

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

      // Verify chaoswhisperer completed and pathseeker was created as first execution item
      const chaosItems = quest.workItems.filter((wi) => wi.role === 'chaoswhisperer');
      const pathseekers = quest.workItems.filter((wi) => wi.role === 'pathseeker');

      expect(quest.status).toBe('complete');
      expect(chaosItems[0]?.status).toBe('complete');
      expect(pathseekers[0]?.role).toBe('pathseeker');
      expect(pathseekers[0]?.status).toBe('complete');
      expect(pathseekers[0]?.dependsOn).toStrictEqual([chaosItems[0]?.id]);
    });

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

      const pathseekers = quest.workItems.filter((wi) => wi.role === 'pathseeker');
      const chaosItems = quest.workItems.filter((wi) => wi.role === 'chaoswhisperer');

      expect(quest.status).toBe('complete');
      expect(chaosItems[0]?.status).toBe('complete');
      expect(pathseekers[0]?.role).toBe('pathseeker');
      expect(pathseekers[0]?.status).toBe('complete');
      expect(pathseekers[0]?.dependsOn).toStrictEqual([chaosItems[0]?.id]);
    });

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
          targetStatuses: ['blocked', 'complete'],
        });

        await GuildRemoveResponder({ guildId: guild.id });
        testbed.cleanup();
        return result;
      });

      // With 'failed' in SATISFIED_STATUSES, ward retry runs even after spiritmender failure.
      // The ward retry fails (empty ward queue) and eventually retries are exhausted.
      // Quest stays blocked because downstream items can't proceed.
      const failedSm = quest.workItems
        .filter((wi) => wi.role === 'spiritmender')
        .filter((wi) => wi.status === 'failed');
      const wardItems = quest.workItems.filter((wi) => wi.role === 'ward');
      const failedWards = wardItems.filter((wi) => wi.status === 'failed');

      expect(failedSm.length).toBeGreaterThanOrEqual(1);
      expect(wardItems.length).toBeGreaterThanOrEqual(2);
      expect(failedWards.length).toBeGreaterThanOrEqual(2);
    });

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
          targetStatuses: ['blocked', 'complete'],
        });

        await GuildRemoveResponder({ guildId: guild.id });
        testbed.cleanup();
        return result;
      });

      // With 'failed' in SATISFIED_STATUSES, ward retry runs even after spiritmender failure.
      // The ward retry fails (empty ward queue) and eventually retries are exhausted.
      // Quest stays blocked because downstream items can't proceed.
      const spiritmenderItems = quest.workItems.filter((wi) => wi.role === 'spiritmender');
      const failedSm = spiritmenderItems.filter((wi) => wi.status === 'failed');
      const wardItems = quest.workItems.filter((wi) => wi.role === 'ward');
      const failedWards = wardItems.filter((wi) => wi.status === 'failed');

      expect(failedSm.length).toBeGreaterThanOrEqual(1);
      expect(wardItems.length).toBeGreaterThanOrEqual(2);
      expect(failedWards.length).toBeGreaterThanOrEqual(2);
    });

    // Test 13: PathSeeker exhausts retries → all pathseekers failed
    // With dependsOn: [failedPathseekerId] on retries and 'failed' in SATISFIED_STATUSES,
    // retry pathseekers chain correctly. After all 3 fail with no pending items,
    // the quest transitions to 'blocked'.
    it('VALID: {pathseeker fails 3 times} => all pathseekers failed, loop terminates', async () => {
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

        // Approve quest but with no steps — quest verification will fail
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

        // With 'failed' in SATISFIED_STATUSES and dependsOn: [prevPathseekerId],
        // retry pathseekers become ready after their predecessor fails.
        // After all 3 fail, all items are terminal. Quest status depends on
        // workItemsToQuestStatusTransformer: no pending items → returns currentStatus.
        // minItems: 4 = chaoswhisperer + 3 pathseeker attempts
        const { quest: result } = await pollUntilWorkItemsSettled({
          questId,
          minItems: 4,
        });

        await GuildRemoveResponder({ guildId: guild.id });
        testbed.cleanup();
        return result;
      });

      const failedPs = quest.workItems
        .filter((wi) => wi.role === 'pathseeker')
        .filter((wi) => wi.status === 'failed');

      // All 3 pathseeker attempts failed verification. Quest stays in_progress
      // because workItemsToQuestStatusTransformer doesn't transition to 'blocked'
      // when there are no pending items (all terminal with some failed).
      expect(failedPs).toHaveLength(3);
    });

    // Test 14: PathSeeker creates 0 steps (edge case)
    // With 0 steps, stepsToWorkItemsTransformer creates ward + siege + finalWard.
    // Both ward and finalWard have empty dependsOn (0 codeweavers, 0 lawbringers).
    // The orchestration loop groups both wards as ready simultaneously, marks both
    // in_progress, but only dispatches the first. The final ward stays in_progress
    // permanently — quest never reaches 'complete'. This is a known limitation when
    // multiple same-role items have empty dependsOn.
    it('VALID: {pathseeker verify passes, 0 steps} => 0 codeweavers, ward + siege dispatched', async () => {
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

        // pathseeker succeeds — verify passes (no observables to violate), 0 steps
        // stepsToWorkItemsTransformer creates ward + siege + finalWard (all with empty dependsOn lists)
        queueResponse(env.claudeQueueDir, agentSuccessResponse({ sessionId: sid('ps-0-steps') }));
        // ward (immediately ready — dependsOn empty codeweaver list)
        queueResponse(env.wardQueueDir, wardPassResponse());
        // siege
        queueResponse(
          env.claudeQueueDir,
          agentSuccessResponse({ sessionId: sid('siege-0-steps') }),
        );
        // final ward (dependsOn empty lawbringer list — immediately ready after siege)
        queueResponse(env.wardQueueDir, wardPassResponse());

        await OrchestrationFlow.start({ questId: typedQuestId });

        const { quest: result } = await pollForQuestStatus({
          questId,
          targetStatuses: ['complete'],
        });

        await GuildRemoveResponder({ guildId: guild.id });
        testbed.cleanup();
        return result;
      });

      const codeweavers = quest.workItems.filter((wi) => wi.role === 'codeweaver');
      const wardItems = quest.workItems.filter((wi) => wi.role === 'ward');
      const siegeItems = quest.workItems.filter((wi) => wi.role === 'siegemaster');

      expect(quest.status).toBe('complete');
      expect(codeweavers).toHaveLength(0);
      expect(wardItems).toHaveLength(2);
      expect(wardItems.every((wi) => wi.status === 'complete')).toBe(true);
      expect(siegeItems.every((wi) => wi.status === 'complete')).toBe(true);
    });

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
    });

    it('VALID: {2 steps} => 2 codeweavers and 2 lawbringers created', async () => {
      const quest = await runInvariantTest(2);

      expect(quest.workItems.filter((wi) => wi.role === 'codeweaver')).toHaveLength(2);
      expect(quest.workItems.filter((wi) => wi.role === 'lawbringer')).toHaveLength(2);
    });

    it('VALID: {3 steps} => 3 codeweavers and 3 lawbringers created', async () => {
      const quest = await runInvariantTest(3);

      expect(quest.workItems.filter((wi) => wi.role === 'codeweaver')).toHaveLength(3);
      expect(quest.workItems.filter((wi) => wi.role === 'lawbringer')).toHaveLength(3);
    });
  });
});
