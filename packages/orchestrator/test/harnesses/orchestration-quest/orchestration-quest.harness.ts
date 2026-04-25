/**
 * PURPOSE: Quest lifecycle helpers for orchestration integration tests — building flows, steps, approval, polling
 *
 * USAGE:
 * const quest = orchestrationQuestHarness();
 * const { guild, questId } = await quest.createTestQuest({ testbed, observableIds: ['obs-1'], stepCount: 2 });
 * const { quest: result } = await quest.pollForStatus({ questId, targetStatuses: ['complete'] });
 */
import type { ProcessId, QuestId } from '@dungeonmaster/shared/contracts';
import type { GuildId } from '@dungeonmaster/shared/contracts';
import {
  DependencyStepStub,
  FlowEdgeStub,
  FlowNodeStub,
  FlowObservableStub,
  FlowStub,
  GuildNameStub,
  GuildPathStub,
  ObservableIdStub,
  QuestWorkItemIdStub,
  StepIdStub,
  WorkItemStub,
  fileContentsContract,
  filePathContract,
  processIdContract,
  workItemContract,
} from '@dungeonmaster/shared/contracts';
import { claudeLineNormalizeBroker } from '@dungeonmaster/shared/brokers';

import type { installTestbedCreateBroker } from '@dungeonmaster/testing';

import { GuildAddResponder } from '../../../src/responders/guild/add/guild-add-responder';
import { GuildRemoveResponder } from '../../../src/responders/guild/remove/guild-remove-responder';
import { QuestUserAddResponder } from '../../../src/responders/quest/user-add/quest-user-add-responder';
import { QuestGetResponder } from '../../../src/responders/quest/get/quest-get-responder';
import { QuestModifyResponder } from '../../../src/responders/quest/modify/quest-modify-responder';
import { ModifyQuestInputStub } from '@dungeonmaster/shared/contracts';
import { guildGetBroker } from '../../../src/brokers/guild/get/guild-get-broker';
import { questFindQuestPathBroker } from '../../../src/brokers/quest/find-quest-path/quest-find-quest-path-broker';
import { questLoadBroker } from '../../../src/brokers/quest/load/quest-load-broker';
import { questOrchestrationLoopBroker } from '../../../src/brokers/quest/orchestration-loop/quest-orchestration-loop-broker';
import { questPersistBroker } from '../../../src/brokers/quest/persist/quest-persist-broker';
import { orchestrationEventsState } from '../../../src/state/orchestration-events/orchestration-events-state';
import { orchestrationProcessesState } from '../../../src/state/orchestration-processes/orchestration-processes-state';
import { rawLineToChatEntriesTransformer } from '../../../src/transformers/raw-line-to-chat-entries/raw-line-to-chat-entries-transformer';
import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';

const QUEST_FILE_NAME = 'quest.json';
const JSON_INDENT_SPACES = 2;

const POLL_INTERVAL_MS = 50;
const MAX_POLL_ITERATIONS = 500;

const TERMINAL_STATUSES = new Set(['complete', 'failed', 'skipped']);
const QUEST_TERMINAL_STATUSES = new Set(['complete', 'blocked', 'abandoned']);

export type QuestType = NonNullable<Awaited<ReturnType<typeof QuestGetResponder>>['quest']>;

export const orchestrationQuestHarness = (): {
  afterEach: () => Promise<void>;
  buildValidFlows: (params: {
    observableIds: ReturnType<typeof ObservableIdStub>[];
  }) => ReturnType<typeof FlowStub>[];
  buildValidSteps: (params: {
    observableIds: ReturnType<typeof ObservableIdStub>[];
    stepCount: number;
  }) => ReturnType<typeof DependencyStepStub>[];
  completeChaosWorkItem: (params: { questId: QuestId }) => Promise<void>;
  completeGlyphWorkItem: (params: { questId: QuestId }) => Promise<void>;
  seedPathseekerWorkItem: (params: { questId: QuestId }) => Promise<void>;
  approveQuest: (params: {
    questId: QuestId;
    observableIds: ReturnType<typeof ObservableIdStub>[];
    stepCount: number;
    finalStatus?: QuestType['status'];
  }) => Promise<void>;
  seedQuestState: (params: {
    questId: QuestId;
    flows?: ReturnType<typeof FlowStub>[];
    steps?: ReturnType<typeof DependencyStepStub>[];
    planningNotes?: QuestType['planningNotes'];
    finalStatus?: QuestType['status'];
  }) => Promise<void>;
  createTestQuest: (params: {
    testbed: ReturnType<typeof installTestbedCreateBroker>;
    observableIds: ReturnType<typeof ObservableIdStub>[];
    stepCount: number;
  }) => Promise<{
    guild: Awaited<ReturnType<typeof GuildAddResponder>>;
    questId: QuestId;
  }>;
  startLoop: (params: { questId: QuestId }) => Promise<ProcessId>;
  pollForStatus: (params: {
    questId: QuestId;
    targetStatuses: QuestType['status'][];
  }) => Promise<{ quest: QuestType }>;
  pollUntilWorkItemsSettled: (params: {
    questId: QuestId;
    minItems?: number;
  }) => Promise<{ quest: QuestType }>;
  removeGuild: (params: { guildId: GuildId }) => Promise<void>;
} => {
  const createdGuildIds: GuildId[] = [];
  const buildValidFlows = ({
    observableIds,
  }: {
    observableIds: ReturnType<typeof ObservableIdStub>[];
  }): ReturnType<typeof FlowStub>[] => {
    const obs = observableIds.map((id) =>
      FlowObservableStub({ id: ObservableIdStub({ value: id }) }),
    );
    const nodeA = FlowNodeStub({
      id: 'node-a' as ReturnType<typeof FlowNodeStub>['id'],
      label: 'Node A',
      type: 'state',
      observables: [],
    });
    // nodeB is the terminal node so the flow has no dead-end non-terminal nodes
    // and terminal-observable-coverage is satisfied.
    const nodeB = FlowNodeStub({
      id: 'node-b' as ReturnType<typeof FlowNodeStub>['id'],
      label: 'Node B',
      type: 'terminal',
      observables: obs,
    });
    const edge = FlowEdgeStub({ from: nodeA.id, to: nodeB.id });
    return [FlowStub({ nodes: [nodeA, nodeB], edges: [edge] })];
  };

  const buildValidSteps = ({
    observableIds,
    stepCount,
  }: {
    observableIds: ReturnType<typeof ObservableIdStub>[];
    stepCount: number;
  }): ReturnType<typeof DependencyStepStub>[] => {
    const steps = [];
    for (let i = 0; i < stepCount; i++) {
      const coveredObs = observableIds.map((id) => ObservableIdStub({ value: id }));
      const brokerPath = `packages/orchestrator/src/brokers/step-${String(i)}/create/step-${String(i)}-create-broker.ts`;
      const testPath = `packages/orchestrator/src/brokers/step-${String(i)}/create/step-${String(i)}-create-broker.test.ts`;
      const proxyPath = `packages/orchestrator/src/brokers/step-${String(i)}/create/step-${String(i)}-create-broker.proxy.ts`;
      steps.push(
        DependencyStepStub({
          id: StepIdStub({ value: `step-${String(i)}` }),
          name: `Step ${String(i)}`,
          observablesSatisfied: coveredObs,
          dependsOn: [],
          focusFile: {
            path: brokerPath,
          },
          accompanyingFiles: [{ path: testPath }, { path: proxyPath }],
          exportName: `step${String(i)}CreateBroker`,
        }),
      );
    }
    return steps;
  };

  const completeChaosWorkItem = async ({ questId }: { questId: QuestId }): Promise<void> => {
    const questResult = await QuestGetResponder({ questId });
    if (!questResult.success || !questResult.quest) {
      return;
    }
    const chaosItem = questResult.quest.workItems.find((wi) => wi.role === 'chaoswhisperer');
    if (!chaosItem) {
      return;
    }
    const updatedWorkItems = questResult.quest.workItems.map((wi) =>
      wi.id === chaosItem.id
        ? { ...wi, status: 'complete' as const, completedAt: new Date().toISOString() }
        : wi,
    );
    await QuestModifyResponder({
      questId,
      input: ModifyQuestInputStub({
        questId,
        workItems: updatedWorkItems,
      }),
    });
  };

  const seedPathseekerWorkItem = async ({ questId }: { questId: QuestId }): Promise<void> => {
    // Inject a pathseeker work item (pending, depends on any chaos/glyph items)
    // mirroring the side effect of OrchestrationStartResponder. Used by tests
    // that seed a quest at in_progress directly and want the orchestration
    // loop to pick up where the spec/design phases would have left off.
    const questResult = await QuestGetResponder({ questId });
    if (!questResult.success || !questResult.quest) {
      return;
    }
    const chatItemIds = questResult.quest.workItems
      .filter((wi) => wi.role === 'chaoswhisperer' || wi.role === 'glyphsmith')
      .map((wi) => wi.id);
    const pathseekerItem = workItemContract.parse({
      id: crypto.randomUUID(),
      role: 'pathseeker',
      status: 'pending',
      spawnerType: 'agent',
      dependsOn: chatItemIds,
      maxAttempts: 3,
      createdAt: new Date().toISOString(),
    });
    await QuestModifyResponder({
      questId,
      input: ModifyQuestInputStub({
        questId,
        workItems: [pathseekerItem],
      }),
    });
  };

  const completeGlyphWorkItem = async ({ questId }: { questId: QuestId }): Promise<void> => {
    const questResult = await QuestGetResponder({ questId });
    if (!questResult.success || !questResult.quest) {
      return;
    }
    const glyphItem = WorkItemStub({
      id: QuestWorkItemIdStub({ value: crypto.randomUUID() }),
      role: 'glyphsmith' as ReturnType<typeof WorkItemStub>['role'],
      status: 'complete' as ReturnType<typeof WorkItemStub>['status'],
      spawnerType: 'agent' as ReturnType<typeof WorkItemStub>['spawnerType'],
      dependsOn: [],
      maxAttempts: 1 as ReturnType<typeof WorkItemStub>['maxAttempts'],
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    });
    await QuestModifyResponder({
      questId,
      input: ModifyQuestInputStub({
        questId,
        workItems: [...questResult.quest.workItems, glyphItem],
      }),
    });
  };

  // approveQuest seeds the quest directly to the 'approved' state (with valid
  // flows + observables + steps) by writing the quest JSON to disk. It bypasses
  // QuestModifyResponder so the lifecycle modify-quest validators (per-status
  // input allowlist, save-time invariants, transition completeness) are not
  // exercised here — those are tested in the broker's own unit tests. This also
  // avoids triggering auto-resume when transitioning to 'in_progress'.
  const seedQuestState = async ({
    questId,
    flows,
    steps,
    planningNotes,
    finalStatus = 'approved',
  }: {
    questId: QuestId;
    flows?: ReturnType<typeof FlowStub>[];
    steps?: ReturnType<typeof DependencyStepStub>[];
    planningNotes?: QuestType['planningNotes'];
    finalStatus?: QuestType['status'];
  }): Promise<void> => {
    const { questPath } = await questFindQuestPathBroker({ questId });
    const questFilePath = filePathContract.parse(
      pathJoinAdapter({ paths: [questPath, QUEST_FILE_NAME] }),
    );
    const loadedQuest = await questLoadBroker({ questFilePath });

    const seededQuest = {
      ...loadedQuest,
      status: finalStatus,
      ...(flows === undefined ? {} : { flows }),
      ...(steps === undefined ? {} : { steps }),
      ...(planningNotes === undefined ? {} : { planningNotes }),
      updatedAt: new Date().toISOString() as typeof loadedQuest.updatedAt,
    };

    const questJson = fileContentsContract.parse(
      JSON.stringify(seededQuest, null, JSON_INDENT_SPACES),
    );
    await questPersistBroker({ questFilePath, contents: questJson, questId });
  };

  const approveQuest = async ({
    questId,
    observableIds,
    stepCount,
    finalStatus = 'approved',
  }: {
    questId: QuestId;
    observableIds: ReturnType<typeof ObservableIdStub>[];
    stepCount: number;
    finalStatus?: QuestType['status'];
  }): Promise<void> => {
    const flowsWithObservables = buildValidFlows({ observableIds });
    const steps = buildValidSteps({ observableIds, stepCount });
    await seedQuestState({
      questId,
      flows: flowsWithObservables,
      steps,
      finalStatus,
    });
  };

  const pollForStatus = async ({
    questId,
    targetStatuses,
  }: {
    questId: QuestId;
    targetStatuses: QuestType['status'][];
  }): Promise<{ quest: QuestType }> => {
    let iterations = 0;
    const poll = async (): Promise<{ quest: QuestType }> => {
      iterations++;
      const result = await QuestGetResponder({ questId });
      if (result.success && result.quest && targetStatuses.includes(result.quest.status)) {
        return { quest: result.quest };
      }
      if (
        result.quest &&
        QUEST_TERMINAL_STATUSES.has(result.quest.status) &&
        !targetStatuses.includes(result.quest.status)
      ) {
        const workItemSummary = result.quest.workItems
          .map((wi) => `${wi.role}:${wi.status}`)
          .join(', ');
        throw new Error(
          `pollForStatus: quest reached terminal "${result.quest.status}" but expected [${targetStatuses.join(', ')}]. ` +
            `Work items: [${workItemSummary}]`,
        );
      }
      if (iterations >= MAX_POLL_ITERATIONS) {
        const currentStatus = result.quest?.status ?? 'unknown';
        const workItemSummary = (result.quest?.workItems ?? [])
          .map((wi) => `${wi.role}:${wi.status}`)
          .join(', ');
        throw new Error(
          `pollForStatus: quest ${questId} never reached [${targetStatuses.join(', ')}] after ${String(iterations)} polls. ` +
            `Current status: ${currentStatus}. Work items: [${workItemSummary}]`,
        );
      }
      return new Promise<{ quest: QuestType }>((resolve) => {
        setTimeout(() => {
          resolve(poll());
        }, POLL_INTERVAL_MS);
      });
    };

    return poll();
  };

  const pollUntilWorkItemsSettled = async ({
    questId,
    minItems = 1,
  }: {
    questId: QuestId;
    minItems?: number;
  }): Promise<{ quest: QuestType }> => {
    let iterations = 0;
    const poll = async (): Promise<{ quest: QuestType }> => {
      iterations++;
      const result = await QuestGetResponder({ questId });
      if (result.success && result.quest) {
        const allSettled = result.quest.workItems.every((wi) => TERMINAL_STATUSES.has(wi.status));
        if (allSettled && result.quest.workItems.length >= minItems) {
          return { quest: result.quest };
        }
      }
      if (iterations >= MAX_POLL_ITERATIONS) {
        const currentStatus = result.quest?.status ?? 'unknown';
        const itemCount = result.quest?.workItems.length ?? 0;
        const workItemSummary = (result.quest?.workItems ?? [])
          .map((wi) => `${wi.role}:${wi.status}`)
          .join(', ');
        throw new Error(
          `pollUntilWorkItemsSettled: quest ${questId} work items never settled after ${String(iterations)} polls. ` +
            `Current status: ${currentStatus}. Items (${String(itemCount)}/${String(minItems)} min): [${workItemSummary}]`,
        );
      }
      return new Promise<{ quest: QuestType }>((resolve) => {
        setTimeout(() => {
          resolve(poll());
        }, POLL_INTERVAL_MS);
      });
    };

    return poll();
  };

  return {
    afterEach: async (): Promise<void> => {
      const idsToRemove = [...createdGuildIds];
      createdGuildIds.length = 0;
      await Promise.all(
        idsToRemove.map(async (guildId) => {
          try {
            await GuildRemoveResponder({ guildId });
          } catch {
            // Guild config may be unavailable if test environment was already cleaned up
          }
        }),
      );
    },
    buildValidFlows,
    buildValidSteps,
    completeChaosWorkItem,
    completeGlyphWorkItem,
    seedPathseekerWorkItem,
    approveQuest,
    seedQuestState,
    createTestQuest: async ({
      testbed,
      observableIds,
      stepCount,
    }: {
      testbed: ReturnType<typeof installTestbedCreateBroker>;
      observableIds: ReturnType<typeof ObservableIdStub>[];
      stepCount: number;
    }) => {
      const guild = await GuildAddResponder({
        name: GuildNameStub({ value: 'Integ Test Guild' }),
        path: GuildPathStub({ value: testbed.guildPath }),
      });

      createdGuildIds.push(guild.id);

      const addResult = await QuestUserAddResponder({
        title: 'Integration Test Quest',
        userRequest: 'An integration test quest',
        guildId: guild.id,
      });

      const questId = addResult.questId!;

      // Seed quest directly at 'in_progress' with valid flows + steps via the
      // disk bypass so the orchestration loop can drive work items to terminal
      // states without stepping through seek_* phases. OrchestrationStartResponder
      // now rejects non-{approved,design_approved} statuses (Fix 3), so these
      // "post-start execution path" tests bypass it: they wire up the quest as
      // if start() already ran, then kick off the loop via startLoop() (below),
      // mirroring how recover-guild-layer-responder launches the loop for
      // already-in-progress quests on server restart.
      await approveQuest({
        questId,
        observableIds,
        stepCount,
        finalStatus: 'in_progress',
      });

      const readBack = await QuestGetResponder({ questId });
      if (readBack.quest && readBack.quest.steps.length !== stepCount) {
        throw new Error(
          `Steps not persisted: expected ${String(stepCount)}, got ${String(readBack.quest.steps.length)}`,
        );
      }

      await completeChaosWorkItem({ questId });

      // Inject the pathseeker work item that OrchestrationStartResponder would
      // have created, so the loop has a starting point.
      await seedPathseekerWorkItem({ questId });

      return { guild, questId };
    },
    startLoop: async ({ questId }: { questId: QuestId }): Promise<ProcessId> => {
      // Mirror the process/loop wiring that OrchestrationStartResponder /
      // RecoverGuildLayerResponder perform, minus the responder's own status
      // transition + work-item mutation. Used by tests that want to exercise
      // the orchestration loop against a quest already seeded at in_progress
      // (see createTestQuest notes above).
      const existingProcess = orchestrationProcessesState.findByQuestId({ questId });
      if (existingProcess) {
        return existingProcess.processId;
      }

      const { guildId } = await questFindQuestPathBroker({ questId });
      const guild = await guildGetBroker({ guildId });
      const startPath = filePathContract.parse(guild.path);

      const processId = processIdContract.parse(`proc-${crypto.randomUUID()}`);
      const abortController = new AbortController();

      orchestrationProcessesState.register({
        orchestrationProcess: {
          processId,
          questId,
          kill: () => {
            abortController.abort();
          },
        },
      });

      questOrchestrationLoopBroker({
        processId,
        questId,
        startPath,
        onAgentEntry: ({ slotIndex, entry, sessionId }) => {
          const rawLine: unknown = Reflect.get(entry, 'raw');
          if (typeof rawLine !== 'string') {
            return;
          }
          const parsed = claudeLineNormalizeBroker({ rawLine });
          const entries = rawLineToChatEntriesTransformer({ parsed, rawLine });
          if (entries.length === 0) {
            return;
          }
          orchestrationEventsState.emit({
            type: 'chat-output',
            processId,
            payload: {
              processId,
              slotIndex,
              entries,
              ...(sessionId === undefined ? {} : { sessionId }),
            },
          });
        },
        abortSignal: abortController.signal,
      })
        .then(() => {
          orchestrationProcessesState.remove({ processId });
        })
        .catch(() => {
          orchestrationProcessesState.remove({ processId });
        });

      return processId;
    },
    pollForStatus,
    pollUntilWorkItemsSettled,
    removeGuild: async ({ guildId }: { guildId: GuildId }): Promise<void> => {
      await GuildRemoveResponder({ guildId });
    },
  };
};
