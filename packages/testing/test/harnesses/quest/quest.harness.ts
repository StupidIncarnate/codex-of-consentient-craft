/**
 * PURPOSE: Manages quest creation, file writing, and status patching for E2E tests
 *
 * USAGE:
 * const quests = questHarness({ request });
 * const created = await quests.createQuest({ guildId: 'abc', title: 'My Quest', userRequest: 'Build it' });
 * quests.writeQuestFile({ questId: 'id', questFolder: 'folder', questFilePath: '/path', status: 'complete', workItems: [...] });
 */
import { writeFileSync } from 'fs';

import type { APIRequestContext } from '@playwright/test';

import type { QuestId, FilePath } from '@dungeonmaster/shared/contracts';
import {
  FlowObservableStub,
  PlanningReviewReportStub,
  PlanningScopeClassificationStub,
  PlanningSynthesisStub,
  PlanningWalkFindingsStub,
} from '@dungeonmaster/shared/contracts';

const JSON_INDENT = 2;
const CREATED_AT_INTERVAL_MS = 1000;

// Statuses that need planningNotes.scopeClassification seeded.
const SCOPE_CLASSIFICATION_STATUSES = new Set([
  'seek_synth',
  'seek_walk',
  'seek_plan',
  'in_progress',
]);
// Statuses that need planningNotes.synthesis seeded (cumulative with above).
const SYNTHESIS_STATUSES = new Set(['seek_walk', 'seek_plan', 'in_progress']);
// Statuses that need planningNotes.walkFindings seeded (cumulative).
const WALK_FINDINGS_STATUSES = new Set(['seek_plan', 'in_progress']);
// Statuses that need planningNotes.reviewReport seeded (cumulative).
const REVIEW_REPORT_STATUSES = new Set(['in_progress']);
// Statuses where flows must have at least one observable on a terminal node
// (so the quest-completeness "terminal observable coverage" check passes).
const REQUIRES_TERMINAL_OBSERVABLE_STATUSES = new Set(['review_observables']);

type PlanningNotesInput = Record<PropertyKey, unknown>;
type FlowInput = Record<PropertyKey, unknown>;

const buildSeededPlanningNotes = ({
  status,
  override,
}: {
  status: string;
  override?: PlanningNotesInput;
}): PlanningNotesInput => {
  const seeded: Record<PropertyKey, unknown> = { ...(override ?? {}) };
  if (seeded.surfaceReports === undefined) {
    seeded.surfaceReports = [];
  }
  if (seeded.blightReports === undefined) {
    seeded.blightReports = [];
  }
  if (SCOPE_CLASSIFICATION_STATUSES.has(status) && seeded.scopeClassification === undefined) {
    seeded.scopeClassification = PlanningScopeClassificationStub();
  }
  if (SYNTHESIS_STATUSES.has(status) && seeded.synthesis === undefined) {
    seeded.synthesis = PlanningSynthesisStub();
  }
  if (WALK_FINDINGS_STATUSES.has(status) && seeded.walkFindings === undefined) {
    seeded.walkFindings = PlanningWalkFindingsStub();
  }
  if (REVIEW_REPORT_STATUSES.has(status) && seeded.reviewReport === undefined) {
    seeded.reviewReport = PlanningReviewReportStub();
  }
  return seeded;
};

const isTerminalNodeWithObservable = (node: unknown): boolean => {
  if (typeof node !== 'object' || node === null) {
    return false;
  }
  const nodeType = Reflect.get(node, 'type');
  const observables = Reflect.get(node, 'observables');
  return nodeType === 'terminal' && Array.isArray(observables) && observables.length > 0;
};

const flowHasTerminalWithObservable = (flow: unknown): boolean => {
  if (typeof flow !== 'object' || flow === null) {
    return false;
  }
  const nodes = Reflect.get(flow, 'nodes');
  if (!Array.isArray(nodes)) {
    return false;
  }
  return nodes.some(isTerminalNodeWithObservable);
};

const hasTerminalWithObservable = ({ flows }: { flows: FlowInput[] }): boolean =>
  flows.some(flowHasTerminalWithObservable);

const injectObservableIntoNode = ({
  node,
  alreadyInjected,
}: {
  node: unknown;
  alreadyInjected: { value: boolean };
}): unknown => {
  if (alreadyInjected.value) {
    return node;
  }
  if (typeof node !== 'object' || node === null) {
    return node;
  }
  if (Reflect.get(node, 'type') !== 'terminal') {
    return node;
  }
  alreadyInjected.value = true;
  const existingObservables = Reflect.get(node, 'observables');
  const existing = Array.isArray(existingObservables) ? existingObservables : [];
  return {
    ...node,
    observables: [
      ...existing,
      FlowObservableStub({
        id: 'harness-terminal-observable' as never,
        description: 'harness-seeded observable' as never,
      }),
    ],
  };
};

const seedTerminalObservables = ({ flows }: { flows: FlowInput[] }): FlowInput[] => {
  if (hasTerminalWithObservable({ flows })) {
    return flows;
  }
  // Add a stub observable to the FIRST terminal node found across all flows.
  const alreadyInjected = { value: false };
  return flows.map((flow) => {
    const nodes = Reflect.get(flow, 'nodes');
    if (!Array.isArray(nodes)) {
      return flow;
    }
    const newNodes = nodes.map((node: unknown) =>
      injectObservableIntoNode({ node, alreadyInjected }),
    );
    return { ...flow, nodes: newNodes };
  });
};

const DEFAULT_FLOWS: FlowInput[] = [
  {
    id: 'harness-flow',
    name: 'Harness Flow',
    flowType: 'runtime',
    entryPoint: 'start',
    exitPoints: ['end'],
    nodes: [
      { id: 'start', label: 'Start', type: 'state', observables: [] },
      { id: 'end', label: 'End', type: 'terminal', observables: [] },
    ],
    edges: [{ id: 'start-to-end', from: 'start', to: 'end' }],
  },
];

export const questHarness = ({
  request,
}: {
  request: APIRequestContext;
}): {
  createQuest: (params: {
    guildId: string;
    title: string;
    userRequest: string;
  }) => Promise<{ questId: QuestId; questFolder: QuestId; filePath: FilePath; success: boolean }>;
  writeQuestFile: (params: {
    questId: string;
    questFolder: string;
    questFilePath: string;
    title?: string;
    status: string;
    workItems: {
      id: string;
      role: string;
      sessionId?: string;
      status?: string;
      spawnerType?: string;
      dependsOn?: string[];
      relatedDataItems?: string[];
      insertedBy?: string;
      createdAt?: string;
      completedAt?: string;
      attempt?: number;
      maxAttempts?: number;
    }[];
    steps?: { id: string; name: string }[];
    userRequest?: string;
    planningNotes?: PlanningNotesInput;
    flows?: FlowInput[];
  }) => void;
  patchQuestStatus: (params: { questId: string; status: string }) => Promise<void>;
  buildQuestJson: (params: {
    questId: string;
    questFolder: string;
    status: string;
    workItems: {
      id: string;
      role: string;
      sessionId: string;
      status?: string;
    }[];
  }) => Record<PropertyKey, unknown>;
} => {
  const createQuest = async ({
    guildId,
    title,
    userRequest,
  }: {
    guildId: string;
    title: string;
    userRequest: string;
  }): Promise<{ questId: QuestId; questFolder: QuestId; filePath: FilePath; success: boolean }> => {
    const response = await request.post('/api/quests', {
      data: { guildId, title, userRequest },
    });
    const result = (await response.json()) as Record<PropertyKey, unknown>;
    const questFolder = Reflect.get(result, 'questFolder');
    const filePath = Reflect.get(result, 'filePath');
    if (typeof questFolder !== 'string' || typeof filePath !== 'string') {
      throw new Error(
        `createQuest API did not return questFolder/filePath: ${JSON.stringify(result)}`,
      );
    }
    return result as {
      questId: QuestId;
      questFolder: QuestId;
      filePath: FilePath;
      success: boolean;
    };
  };

  const writeQuestFile = ({
    questId,
    questFolder,
    questFilePath,
    title = 'E2E Quest',
    status,
    workItems,
    steps = [],
    userRequest = 'Build the feature',
    planningNotes,
    flows,
  }: {
    questId: string;
    questFolder: string;
    questFilePath: string;
    title?: string;
    status: string;
    workItems: {
      id: string;
      role: string;
      sessionId?: string;
      status?: string;
      spawnerType?: string;
      dependsOn?: string[];
      relatedDataItems?: string[];
      insertedBy?: string;
      createdAt?: string;
      completedAt?: string;
      attempt?: number;
      maxAttempts?: number;
    }[];
    steps?: { id: string; name: string }[];
    userRequest?: string;
    planningNotes?: PlanningNotesInput;
    flows?: FlowInput[];
  }): void => {
    const seededPlanningNotes = buildSeededPlanningNotes({
      status,
      ...(planningNotes === undefined ? {} : { override: planningNotes }),
    });
    const baseFlows: FlowInput[] = flows ?? DEFAULT_FLOWS;
    const seededFlows: FlowInput[] = REQUIRES_TERMINAL_OBSERVABLE_STATUSES.has(status)
      ? seedTerminalObservables({ flows: baseFlows })
      : baseFlows;
    const quest = {
      id: questId,
      folder: questFolder,
      title,
      status,
      createdAt: new Date().toISOString(),
      workItems: workItems.map((wi, index) => ({
        id: wi.id,
        role: wi.role,
        status: wi.status ?? 'complete',
        spawnerType: wi.spawnerType ?? 'agent',
        ...(wi.sessionId === undefined ? {} : { sessionId: wi.sessionId }),
        createdAt:
          wi.createdAt ?? new Date(Date.now() + index * CREATED_AT_INTERVAL_MS).toISOString(),
        relatedDataItems: wi.relatedDataItems ?? [],
        dependsOn: wi.dependsOn ?? [],
        attempt: wi.attempt ?? 0,
        maxAttempts: wi.maxAttempts ?? 1,
        ...(wi.insertedBy ? { insertedBy: wi.insertedBy } : {}),
        ...(wi.completedAt === undefined ? {} : { completedAt: wi.completedAt }),
      })),
      userRequest,
      designDecisions: [],
      steps: steps.map((s) => ({
        id: s.id,
        name: s.name,
        assertions: [
          {
            prefix: 'VALID',
            input: '{valid input}',
            expected: 'returns expected result',
          },
        ],
        observablesSatisfied: [],
        dependsOn: [],
        focusFile: { path: 'src/test-step.ts' },
        accompanyingFiles: [],
        inputContracts: ['Void'],
        outputContracts: ['Void'],
        uses: [],
      })),
      toolingRequirements: [],
      contracts: [],
      planningNotes: seededPlanningNotes,
      flows: seededFlows,
      wardResults: [],
    };

    writeFileSync(questFilePath, JSON.stringify(quest, null, JSON_INDENT));
  };

  const patchQuestStatus = async ({
    questId,
    status,
  }: {
    questId: string;
    status: string;
  }): Promise<void> => {
    await request.patch(`/api/quests/${questId}`, {
      data: { status },
    });
  };

  const buildQuestJson = ({
    questId,
    questFolder,
    status,
    workItems,
  }: {
    questId: string;
    questFolder: string;
    status: string;
    workItems: {
      id: string;
      role: string;
      sessionId: string;
      status?: string;
    }[];
  }): Record<PropertyKey, unknown> => ({
    id: questId,
    folder: questFolder,
    title: 'E2E Quest',
    status,
    createdAt: new Date().toISOString(),
    workItems: workItems.map((wi) => ({
      id: wi.id,
      role: wi.role,
      status: wi.status ?? 'complete',
      spawnerType: 'agent',
      sessionId: wi.sessionId,
      createdAt: new Date().toISOString(),
      relatedDataItems: [],
      dependsOn: [],
    })),
    userRequest: 'Build the feature',
    designDecisions: [],
    steps: [],
    toolingRequirements: [],
    contracts: [],
    flows: [
      {
        id: 'harness-flow',
        name: 'Harness Flow',
        flowType: 'runtime',
        entryPoint: 'start',
        exitPoints: ['end'],
        nodes: [
          { id: 'start', label: 'Start', type: 'state', observables: [] },
          { id: 'end', label: 'End', type: 'terminal', observables: [] },
        ],
        edges: [{ id: 'start-to-end', from: 'start', to: 'end' }],
      },
    ],
  });

  return {
    createQuest,
    writeQuestFile,
    patchQuestStatus,
    buildQuestJson,
  };
};
