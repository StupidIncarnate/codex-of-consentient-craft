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

const JSON_INDENT = 2;
const CREATED_AT_INTERVAL_MS = 1000;

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
  }): void => {
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
        focusFile: { path: 'src/test-step.ts', action: 'create' },
        accompanyingFiles: [],
        inputContracts: ['Void'],
        outputContracts: ['Void'],
        uses: [],
      })),
      toolingRequirements: [],
      contracts: [],
      flows: [
        {
          id: 'harness-flow',
          name: 'Harness Flow',
          entryPoint: 'start',
          exitPoints: ['end'],
          nodes: [
            { id: 'start', label: 'Start', type: 'state', observables: [] },
            { id: 'end', label: 'End', type: 'terminal', observables: [] },
          ],
          edges: [{ id: 'start-to-end', from: 'start', to: 'end' }],
        },
      ],
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
