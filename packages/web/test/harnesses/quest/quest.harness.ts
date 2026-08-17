/**
 * PURPOSE: Manages quest creation, file writing, and status patching for E2E tests
 *
 * USAGE:
 * const quests = questHarness({ request });
 * const created = await quests.createQuest({ guildId: 'abc', title: 'My Quest', userRequest: 'Build it' });
 * quests.writeQuestFile({ questId: 'id', questFolder: 'folder', questFilePath: '/path', status: 'complete', workItems: [...] });
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';

import type { APIRequestContext } from '@playwright/test';

import {
  addQuestResultContract,
  type QuestId,
  type FilePath,
  type WorkItemRole,
} from '@dungeonmaster/shared/contracts';
import { isCommandWorkItemRoleGuard } from '@dungeonmaster/shared/guards';

import { questFlowObservableSeedTransformer } from '@dungeonmaster/testing/transformers/quest-flow-observable-seed';

const JSON_INDENT = 2;
const CREATED_AT_INTERVAL_MS = 1000;

type PlanningNotesInput = Record<PropertyKey, unknown>;
type FlowInput = Record<PropertyKey, unknown>;
// One quest.packagesAffected entry, written verbatim. This is the ONLY thing that gives a node's
// package tag a KIND, so a seeded quest whose flows tag a name absent from here renders its chips
// unresolved on the canvas — which is what the tag-coverage failure case looks like to a reviewer.
type PackageEntryInput = Record<PropertyKey, unknown>;
// One quest.contracts entry, written verbatim. Its `nodeId` is the anchor the flow-diagram detail
// panel filters on, so a seeded contract only reaches a panel when nodeId names a node in the flow.
type ContractEntryInput = Record<PropertyKey, unknown>;
// One quest.comments entry, written verbatim — the shape the comment batch route persists. Omitting
// `observableId` anchors the comment to the node card itself; setting it anchors the comment to one
// of that node's assertion cards.
type CommentInput = Record<PropertyKey, unknown>;
// A quest.json exactly as the SERVER wrote it, read back to be edited in place rather than rebuilt.
// Deliberately opaque: the point of `rewindQuestStatus` is that every key it does not name survives
// untouched, so naming any of them here would invite a caller to reach for one.
type PersistedQuestInput = Record<PropertyKey, unknown>;

// The one package every default-seeded flow node tags, declared so its chips resolve to a real kind
// rather than painting unresolved. Deliberately NOT a name from this repo: nothing in the app may
// recognise a package by name, and a fixture built from real names would hide it if something did.
const DEFAULT_PACKAGE_NAME = 'auth-service';
const DEFAULT_PACKAGES_AFFECTED: PackageEntryInput[] = [
  {
    name: DEFAULT_PACKAGE_NAME,
    location: './packages/auth-service',
    changeType: 'edit',
    packageType: 'library',
  },
];
// What a seeded codeweaver item claims when the caller names nothing. The `approved` gate refuses a
// ledger that leaves any package tagged on the spine unclaimed, so a quest driven through that gate
// by a test needs its plan to cover the tags its flows carry — which for the default flows is this
// one package.
const DEFAULT_CODEWEAVER_PACKAGE_NAMES = [DEFAULT_PACKAGE_NAME];

const DEFAULT_FLOWS: FlowInput[] = [
  {
    id: 'harness-flow',
    name: 'Harness Flow',
    flowType: 'runtime',
    entryPoint: 'start',
    exitPoints: ['end'],
    nodes: [
      { id: 'start', label: 'Start', type: 'state', packages: ['auth-service'], observables: [] },
      { id: 'end', label: 'End', type: 'terminal', packages: ['auth-service'], observables: [] },
    ],
    edges: [{ id: 'start-to-end', from: 'start', to: 'end' }],
  },
];

// DEFAULT_FLOWS with the Flowrider track's scope already signed — the state a quest is in by the
// time its flowrider session signals `done`. `signal-back` recomputes that scope and REFUSES
// `operationStatus: 'done'` from a flowrider operation item while any verification unit on the
// quest's runtime flows carries no `flowriderSignoff`, so a seeded ledger driving a flowrider to
// `done` has to carry the sign-offs that session would have written; without them the refusal
// throws, the work item ends `failed` and the quest goes `blocked`.
//
// On this flow the Flowrider denominator is exactly ONE unit — the `end` node. A terminal unit is a
// node with NO OUTGOING EDGE (not one typed `terminal`), the single edge carries no label so it is
// no branch unit, no node carries an observable, and the off-map probe families belong to the
// Siegemaster track alone.
const DEFAULT_FLOWS_FLOWRIDER_SIGNED: FlowInput[] = [
  {
    id: 'harness-flow',
    name: 'Harness Flow',
    flowType: 'runtime',
    entryPoint: 'start',
    exitPoints: ['end'],
    nodes: [
      { id: 'start', label: 'Start', type: 'state', packages: ['auth-service'], observables: [] },
      {
        id: 'end',
        label: 'End',
        type: 'terminal',
        packages: ['auth-service'],
        observables: [],
        flowriderSignoff: {
          verdict: 'confirmed',
          evidence:
            'packages/web/test/harnesses/quest/quest.harness.ts — seeded flow signed at quest-write time so the completion gate measures a settled scope',
          workItemId: 'e2e00000-0000-4000-8000-0000000000f9',
          at: '2026-01-01T00:00:00.000Z',
        },
      },
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
    questType?: string;
    workItems: {
      id: string;
      role: string;
      sessionId?: string;
      agentId?: string;
      status?: string;
      spawnerType?: string;
      dependsOn?: string[];
      relatedDataItems?: string[];
      insertedBy?: string;
      createdAt?: string;
      completedAt?: string;
      attempt?: number;
      maxAttempts?: number;
      wardMode?: string;
    }[];
    steps?: { id: string; name: string }[];
    userRequest?: string;
    planningNotes?: PlanningNotesInput;
    flows?: FlowInput[];
    packagesAffected?: PackageEntryInput[];
    contracts?: ContractEntryInput[];
    comments?: CommentInput[];
    wardResults?: {
      id: string;
      exitCode: number;
      wardMode?: string;
      runId?: string;
      createdAt?: string;
    }[];
    operations?: {
      id: string;
      role: string;
      text: string;
      status: string;
      locked?: boolean;
      wardMode?: string;
      packageNames?: string[];
    }[];
  }) => void;
  writeUnparseableQuestFile: (params: {
    questId: string;
    questFolder: string;
    questFilePath: string;
  }) => void;
  writeWardResultDetail: (params: {
    questFilePath: string;
    wardResultId: string;
    detail: Record<PropertyKey, unknown>;
  }) => void;
  patchQuestStatus: (params: { questId: string; status: string }) => Promise<void>;
  rewindQuestStatus: (params: { questFilePath: string; status: string }) => void;
  questFolderExists: (params: { questFilePath: string }) => boolean;
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
    operations?: {
      id: string;
      role: string;
      text: string;
      status: string;
      locked?: boolean;
      wardMode?: string;
      packageNames?: string[];
    }[];
  }) => Record<PropertyKey, unknown>;
  seedInProgressWithOperations: (params: {
    questId: string;
    questFolder: string;
    questFilePath: string;
    title?: string;
    operations: {
      id: string;
      role: string;
      text: string;
      status: string;
      locked?: boolean;
      wardMode?: string;
      packageNames?: string[];
    }[];
    firstWorkItemId: string;
    firstWorkItemStatus?: string;
    firstWorkItemSessionId?: string;
    flowriderScopeSignedOff?: boolean;
  }) => void;
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
    questType,
    workItems,
    steps = [],
    userRequest = 'Build the feature',
    planningNotes,
    flows,
    packagesAffected = DEFAULT_PACKAGES_AFFECTED,
    contracts = [],
    comments,
    wardResults = [],
    operations = [],
  }: {
    questId: string;
    questFolder: string;
    questFilePath: string;
    title?: string;
    status: string;
    questType?: string;
    workItems: {
      id: string;
      role: string;
      sessionId?: string;
      agentId?: string;
      status?: string;
      spawnerType?: string;
      dependsOn?: string[];
      relatedDataItems?: string[];
      insertedBy?: string;
      createdAt?: string;
      completedAt?: string;
      attempt?: number;
      maxAttempts?: number;
      wardMode?: string;
    }[];
    steps?: { id: string; name: string }[];
    userRequest?: string;
    planningNotes?: PlanningNotesInput;
    flows?: FlowInput[];
    packagesAffected?: PackageEntryInput[];
    contracts?: ContractEntryInput[];
    comments?: CommentInput[];
    wardResults?: {
      id: string;
      exitCode: number;
      wardMode?: string;
      runId?: string;
      createdAt?: string;
    }[];
    operations?: {
      id: string;
      role: string;
      text: string;
      status: string;
      locked?: boolean;
      wardMode?: string;
      packageNames?: string[];
    }[];
  }): void => {
    const seededPlanningNotes: PlanningNotesInput = planningNotes ?? {};
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
      ...(questType === undefined ? {} : { questType }),
      createdAt: new Date().toISOString(),
      workItems: workItems.map((wi, index) => ({
        id: wi.id,
        role: wi.role,
        status: wi.status ?? 'complete',
        spawnerType: wi.spawnerType ?? 'agent',
        ...(wi.sessionId === undefined ? {} : { sessionId: wi.sessionId }),
        ...(wi.agentId === undefined ? {} : { agentId: wi.agentId }),
        createdAt:
          wi.createdAt ?? new Date(Date.now() + index * CREATED_AT_INTERVAL_MS).toISOString(),
        relatedDataItems: wi.relatedDataItems ?? [],
        dependsOn: wi.dependsOn ?? [],
        attempt: wi.attempt ?? 0,
        maxAttempts: wi.maxAttempts ?? 1,
        ...(wi.insertedBy ? { insertedBy: wi.insertedBy } : {}),
        ...(wi.completedAt === undefined ? {} : { completedAt: wi.completedAt }),
        ...(wi.wardMode === undefined ? {} : { wardMode: wi.wardMode }),
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
      packagesAffected,
      contracts,
      // The key is OMITTED unless the caller seeds comments, so every quest this harness writes is
      // by default shaped exactly like a quest.json authored before the comments field existed —
      // which is what proves questContract still parses one and defaults comments to [].
      ...(comments === undefined ? {} : { comments }),
      planningNotes: seededPlanningNotes,
      flows: seededFlows,
      wardResults: wardResults.map((wr) => ({
        id: wr.id,
        createdAt: wr.createdAt ?? new Date().toISOString(),
        exitCode: wr.exitCode,
        ...(wr.runId === undefined ? {} : { runId: wr.runId }),
        ...(wr.wardMode === undefined ? {} : { wardMode: wr.wardMode }),
      })),
      // Written verbatim as quest.operations — the ordered ledger the relay dispatches from.
      // A codeweaver item with no declared packages fails the `approved` gate's coverage check
      // against the flows above, so the default claims exactly what those flows tag.
      operations: operations.map((op) => ({
        id: op.id,
        role: op.role,
        text: op.text,
        status: op.status,
        locked: op.locked ?? false,
        packageNames:
          op.packageNames ?? (op.role === 'codeweaver' ? DEFAULT_CODEWEAVER_PACKAGE_NAMES : []),
        ...(op.wardMode === undefined ? {} : { wardMode: op.wardMode }),
      })),
    };

    writeFileSync(questFilePath, JSON.stringify(quest, null, JSON_INDENT));

    // Append a quest-modified event to the outbox so the HTTP server's quest-driven
    // watcher reactor reconciles immediately, just like questPersistBroker does in
    // production. Without this, the reactor depends on its 3s fallback poll to notice
    // the new workItem.sessionId stamp — racing the LIVE_MARKER assertion's 10s
    // visibility timeout in quest-streaming-subagent-execution-rows.spec.ts.
    // questFilePath shape: <DUNGEONMASTER_HOME>/guilds/<guildId>/quests/<questFolder>/quest.json
    // walk up four levels to reach DUNGEONMASTER_HOME, then append `event-outbox.jsonl`.
    const dungeonmasterHome = dirname(dirname(dirname(dirname(questFilePath))));
    const outboxPath = `${dungeonmasterHome}/event-outbox.jsonl`;
    const outboxLine = `${JSON.stringify({ questId, timestamp: new Date().toISOString() })}\n`;
    appendFileSync(outboxPath, outboxLine);
  };

  // Writes a quest.json that questContract REJECTS, into a real quest folder the guild's
  // quests dir enumerates. Mirrors a file written by an older schema: a workItem role that is
  // no longer in workItemRoleContract plus relatedDataItems as bare uuids instead of the
  // `{collection}/{id}` shape. Used to prove one such file cannot take the whole guild's quest
  // list — and therefore the dispatcher's active-quest scan — down with it.
  const writeUnparseableQuestFile = ({
    questId,
    questFolder,
    questFilePath,
  }: {
    questId: string;
    questFolder: string;
    questFilePath: string;
  }): void => {
    const quest = {
      id: questId,
      folder: questFolder,
      title: 'Legacy schema quest',
      status: 'complete',
      createdAt: new Date().toISOString(),
      userRequest: 'Written by an older schema',
      designDecisions: [],
      operations: [],
      toolingRequirements: [],
      contracts: [],
      flows: [],
      wardResults: [],
      workItems: [
        {
          id: 'e2e00000-0000-4000-8000-0000000000ff',
          role: 'pathseeker',
          status: 'complete',
          spawnerType: 'agent',
          createdAt: new Date().toISOString(),
          relatedDataItems: ['e2e00000-0000-4000-8000-0000000000fe'],
          dependsOn: [],
          attempt: 0,
          maxAttempts: 1,
        },
      ],
    };

    writeFileSync(questFilePath, JSON.stringify(quest, null, JSON_INDENT));
  };

  const writeWardResultDetail = ({
    questFilePath,
    wardResultId,
    detail,
  }: {
    questFilePath: string;
    wardResultId: string;
    detail: Record<PropertyKey, unknown>;
  }): void => {
    // The server's ward-detail endpoint reads <questFolder>/ward-results/<id>.json. The quest
    // folder is the directory holding quest.json.
    const wardResultsDir = join(dirname(questFilePath), 'ward-results');
    mkdirSync(wardResultsDir, { recursive: true });
    writeFileSync(
      join(wardResultsDir, `${wardResultId}.json`),
      JSON.stringify(detail, null, JSON_INDENT),
    );
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

  // Rewrites ONLY the `status` field of an existing quest.json, leaving every other byte — the
  // seeded operations ledger, the work items, the package graph — exactly as the SERVER wrote it,
  // then appends the same quest-modified outbox line questPersistBroker would so the watcher
  // reconciles immediately. Reach for this over writeQuestFile whenever the state under test is one
  // the server produced and the fixture only needs to move the quest back across a gate:
  // writeQuestFile rebuilds a quest from its own defaults, so round-tripping a server-written quest
  // through it silently drops everything its parameter list does not name.
  const rewindQuestStatus = ({
    questFilePath,
    status,
  }: {
    questFilePath: string;
    status: string;
  }): void => {
    const persisted = JSON.parse(readFileSync(questFilePath, 'utf8')) as PersistedQuestInput;

    writeFileSync(questFilePath, JSON.stringify({ ...persisted, status }, null, JSON_INDENT));

    const dungeonmasterHome = dirname(dirname(dirname(dirname(questFilePath))));
    appendFileSync(
      `${dungeonmasterHome}/event-outbox.jsonl`,
      `${JSON.stringify({ questId: String(persisted.id), timestamp: new Date().toISOString() })}\n`,
    );
  };

  // The quest folder is the directory holding quest.json — i.e. dirname(questFilePath),
  // which resolves to <DUNGEONMASTER_HOME>/guilds/<guildId>/quests/<questFolder>/. The
  // backend delete removes this folder recursively, so a UI delete should leave it absent.
  const questFolderExists = ({ questFilePath }: { questFilePath: string }): boolean =>
    existsSync(dirname(questFilePath));

  const buildQuestJson = ({
    questId,
    questFolder,
    status,
    workItems,
    operations = [],
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
    operations?: {
      id: string;
      role: string;
      text: string;
      status: string;
      locked?: boolean;
      wardMode?: string;
      packageNames?: string[];
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
    operations: operations.map((op) => ({
      id: op.id,
      role: op.role,
      text: op.text,
      status: op.status,
      locked: op.locked ?? false,
      packageNames:
        op.packageNames ?? (op.role === 'codeweaver' ? DEFAULT_CODEWEAVER_PACKAGE_NAMES : []),
      ...(op.wardMode === undefined ? {} : { wardMode: op.wardMode }),
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
          {
            id: 'start',
            label: 'Start',
            type: 'state',
            packages: ['auth-service'],
            observables: [],
          },
          {
            id: 'end',
            label: 'End',
            type: 'terminal',
            packages: ['auth-service'],
            observables: [],
          },
        ],
        edges: [{ id: 'start-to-end', from: 'start', to: 'end' }],
      },
    ],
  });

  // Seeds a quest directly to `in_progress` with an operations ledger + ONE work item linked 1:1 to
  // the first operation item (relatedDataItems: ['operations/<op0.id>']) — mirroring a quest whose
  // Start Quest transition already seeded the relay. The first operation item is expected to be
  // `in_progress` and the linked work item `pending` (dispatch pre-stamps it in_progress on spawn).
  const seedInProgressWithOperations = ({
    questId,
    questFolder,
    questFilePath,
    title,
    operations,
    firstWorkItemId,
    firstWorkItemStatus = 'pending',
    firstWorkItemSessionId,
    flowriderScopeSignedOff = false,
  }: {
    questId: string;
    questFolder: string;
    questFilePath: string;
    title?: string;
    operations: {
      id: string;
      role: string;
      text: string;
      status: string;
      locked?: boolean;
      wardMode?: string;
      packageNames?: string[];
    }[];
    firstWorkItemId: string;
    firstWorkItemStatus?: string;
    // Seeds a RETAINED session on the first work item — the shape a quest is left in when its
    // agent died mid-flight. Deliberately seeded WITHOUT a `resume` marker, because that is the
    // state that used to fresh-spawn and overwrite the session.
    firstWorkItemSessionId?: string;
    // Seeds the quest's runtime flow with a `flowriderSignoff` on every unit the Flowrider track
    // measures. Set this whenever the ledger carries a `flowrider` item the spec drives to `done`:
    // signal-back recomputes that scope and refuses `done` while any unit is unsigned.
    flowriderScopeSignedOff?: boolean;
  }): void => {
    const [firstOp] = operations;
    if (firstOp === undefined) {
      throw new Error('seedInProgressWithOperations requires at least one operation');
    }

    writeQuestFile({
      questId,
      questFolder,
      questFilePath,
      ...(title === undefined ? {} : { title }),
      status: 'in_progress',
      operations,
      ...(flowriderScopeSignedOff ? { flows: DEFAULT_FLOWS_FLOWRIDER_SIGNED } : {}),
      workItems: [
        {
          id: firstWorkItemId,
          role: firstOp.role,
          status: firstWorkItemStatus,
          spawnerType: isCommandWorkItemRoleGuard({ role: firstOp.role as WorkItemRole })
            ? 'command'
            : 'agent',
          relatedDataItems: [`operations/${firstOp.id}`],
          ...(firstWorkItemSessionId === undefined ? {} : { sessionId: firstWorkItemSessionId }),
          ...(firstOp.wardMode === undefined ? {} : { wardMode: firstOp.wardMode }),
        },
      ],
    });
  };

  return {
    createQuest,
    writeQuestFile,
    writeUnparseableQuestFile,
    writeWardResultDetail,
    patchQuestStatus,
    rewindQuestStatus,
    questFolderExists,
    buildQuestJson,
    seedInProgressWithOperations,
  };
};
