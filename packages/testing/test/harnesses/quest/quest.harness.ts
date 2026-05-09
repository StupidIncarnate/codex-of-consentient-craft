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

import {
  addQuestResultContract,
  type QuestId,
  type FilePath,
} from '@dungeonmaster/shared/contracts';

import { questFlowObservableSeedTransformer } from '../../../src/transformers/quest-flow-observable-seed/quest-flow-observable-seed-transformer';
import { questGateContentSeedTransformer } from '../../../src/transformers/quest-gate-content-seed/quest-gate-content-seed-transformer';

const JSON_INDENT = 2;
const CREATED_AT_INTERVAL_MS = 1000;

type PlanningNotesInput = Record<PropertyKey, unknown>;
type FlowInput = Record<PropertyKey, unknown>;

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
    const result = addQuestResultContract.parse(await response.json());
    if (!result.questFolder || !result.filePath) {
      throw new Error(
        `createQuest API did not return questFolder/filePath: ${JSON.stringify(result)}`,
      );
    }
    return {
      success: result.success,
      questId: result.questId!,
      questFolder: result.questFolder as unknown as QuestId,
      filePath: result.filePath as FilePath,
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
    const seededPlanningNotes = questGateContentSeedTransformer({
      status,
      ...(planningNotes === undefined ? {} : { override: planningNotes }),
    });
    const baseFlows: FlowInput[] = flows ?? DEFAULT_FLOWS;
    const seededFlows: FlowInput[] = questFlowObservableSeedTransformer({
      flows: baseFlows,
      status,
    });
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
      // V1 invariant: every step's id MUST start with `${slice}-`. Derive the
      // slice from the id's first segment (text before the first '-'), so
      // callers passing 'cw-step' get slice 'cw' and id remains 'cw-step'.
      // This keeps relatedDataItems references pointing at the same step ids
      // the test suite already uses ('steps/cw-step', 'steps/lb-step', etc.)
      // while satisfying the slice-prefix invariant on round-trip read.
      steps: steps.map((s) => {
        const dashIndex = s.id.indexOf('-');
        const sliceName = dashIndex === -1 ? s.id : s.id.slice(0, dashIndex);
        return {
          id: s.id,
          slice: sliceName,
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
        };
      }),
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
