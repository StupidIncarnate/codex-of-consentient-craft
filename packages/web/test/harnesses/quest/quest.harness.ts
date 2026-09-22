/**
 * PURPOSE: Manages quest creation, file writing, and status patching for E2E tests
 *
 * USAGE:
 * const quests = questHarness({ request });
 * const created = await quests.createQuest({ guildId: 'abc', title: 'My Quest', userRequest: 'Build it' });
 * await quests.writeQuestFile({ questId: 'id', questFolder: 'folder', questFilePath: '/path', status: 'complete', workItems: [...] });
 */
import { existsSync, promises as fsPromises } from 'fs';
import { basename, dirname, join } from 'path';

import type { APIRequestContext } from '@playwright/test';

import {
  guildIdContract,
  filePathContract,
  questContract,
  questIdContract,
  type Quest,
  type QuestId,
  type GuildId,
  type FilePath,
  type WorkItemRole,
} from '@dungeonmaster/shared/contracts';
import { dungeonmasterHomeStatics, environmentStatics } from '@dungeonmaster/shared/statics';
import { isCommandWorkItemRoleGuard } from '@dungeonmaster/shared/guards';

import { questFlowObservableSeedTransformer } from '@dungeonmaster/testing/transformers/quest-flow-observable-seed';
import { dmTargetHarness } from '../dm-target/dm-target.harness';
import { dmRegistryBroker, recipesHydrationCreateBroker } from '@dungeonmaster/hydration-recipes';
import { dmHttpResponseContract } from '@dungeonmaster/hydration-recipes/contracts';
import type { DmHttpResponse } from '@dungeonmaster/hydration-recipes/contracts';

const { recipe } = recipesHydrationCreateBroker();
const QUEST_SAVE_NAME = 'quest';

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
// One quest.sessions entry, written verbatim — the row questSessionRecordBroker appends the first
// time a session is stamped. Its `cwd` is what BOTH read paths resolve a transcript through, so
// seeding two rows with two different cwds is the only way to stand a fixture up in the arrangement
// a carve really leaves behind: the intake conversation under the guild path's JSONL encoding, every
// role after riftcarver under the worktree's.
type QuestSessionInput = Record<PropertyKey, unknown>;
// A quest.json exactly as the SERVER wrote it, read back to be edited in place rather than rebuilt.
// Deliberately opaque: the point of `rewindQuestStatus` is that every key it does not name survives
// untouched, so naming any of them here would invite a caller to reach for one.
type PersistedQuestInput = Record<PropertyKey, unknown>;
// One row of a `GET /api/guilds` or `GET /api/quests?guildId=…` response body. Opaque: these two
// real production routes are read only to resolve which guild owns a bare `questId` (only its `id`
// is read), never as a domain shape this harness owns.
type ApiListRecord = Record<PropertyKey, unknown>;

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
  baseURL,
  request,
}: {
  baseURL?: string;
  request: APIRequestContext;
}): {
  createQuest: (params: {
    guildId: string;
    title: string;
    userRequest: string;
  }) => Promise<{ questId: QuestId; questFolder: QuestId; filePath: FilePath; success: boolean }>;
  // Same plan shape as createQuest, run against the `write` target instead of the `api` one — for
  // a spec proving the two routes produce equivalent domain state for the same ingredient.
  createQuestViaWriteRoute: (params: {
    guildId: string;
    title: string;
    userRequest: string;
  }) => Promise<{ questId: QuestId; questFolder: QuestId; filePath: FilePath }>;
  writeQuestFile: (params: {
    guildId?: string;
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
      step?: string;
      dependsOn?: string[];
      relatedDataItems?: string[];
      insertedBy?: string;
      createdAt?: string;
      completedAt?: string;
      attempt?: number;
      maxAttempts?: number;
      observations?: {
        unitId: string;
        mark: string;
        evidence: string;
        toSettle?: string;
        at?: string;
      }[];
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
      packageNames?: string[];
    }[];
    sessions?: QuestSessionInput[];
    worktreePath?: string;
    branchName?: string;
    baseBranch?: string;
  }) => Promise<void>;
  // The same shape writeQuestFile assembles, but written straight to disk with no questContract
  // validation and no dmRegistryBroker route — used only by
  // flows/quest-chat/malformed-quest-file-reported.e2e.ts, which needs a quest.json the SERVER
  // rejects on read. Never reach for this to work around a writeQuestFile throw elsewhere: that
  // throw is the framework refusing a shape it cannot honestly write, not a gap to route around.
  writeMalformedQuestFile: (params: {
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
      step?: string;
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
      packageNames?: string[];
    }[];
    sessions?: QuestSessionInput[];
    worktreePath?: string;
    branchName?: string;
    baseBranch?: string;
  }) => Promise<void>;
  writeUnparseableQuestFile: (params: {
    questId: string;
    questFolder: string;
    questFilePath: string;
  }) => Promise<void>;
  tamperQuestUnparseableFile: (params: {
    questId: string;
    questFolder: string;
    questFilePath: string;
  }) => Promise<void>;
  writeWardResultDetail: (params: {
    questFilePath: string;
    wardResultId: string;
    detail: Record<PropertyKey, unknown>;
  }) => Promise<void>;
  patchQuestStatus: (params: { questId: string; status: string }) => Promise<void>;
  // Walks a quest to 'in_progress' through dmRegistryBroker's declared transitions.reach — the
  // quest ingredient's own route for that hop is the real POST /api/quests/:questId/start (see
  // quest-ingredient-broker.ts's own header), never a bare status write. patchQuestStatus's
  // setRaw flips the field with none of the real route's side effects (operations relay seed,
  // execution-queue enqueue, the WS broadcast); reach for THIS whenever a spec asserts on those.
  startQuest: (params: { questId: string }) => Promise<void>;
  // RAW ON PURPOSE: 'paused' is deliberately excluded from the quest ingredient's own
  // `transitions.to` — its header names the gap directly: "questModifyBroker REFUSES a bare
  // status: 'paused' write outright... Reaching it for real also kills every registered
  // subprocess, which needs state/ this package cannot import." POST /api/quests/:questId/pause
  // is the only route onto it; no dmRegistryBroker verb can express it.
  pauseQuest: (params: { questId: string }) => Promise<void>;
  // RAW ON PURPOSE — see the broker's own header: patchQuestStatus's setRaw route fires none of
  // the real PATCH route's side effects, and the WS broadcast is exactly the side effect this one
  // exists for. PATCH /api/quests/:questId with the status the quest ALREADY has is the only route
  // onto it.
  forceStatusRebroadcast: (params: { questId: string; status: string }) => Promise<void>;
  // RAW ON PURPOSE — same cross-process gap as forceStatusRebroadcast above: dmRegistryBroker's
  // `update` route calls questModifyBroker inside THIS test process, so its questPersistBroker
  // outbox append is cross-process relative to the real dev server hosting
  // orchestratorOutboxWatchAdapter and does not reliably wake it. PATCH /api/quests/:questId run
  // through the server's own HTTP handler is what appends the outbox INSIDE that process, which is
  // what a spec asserting on the WS-delivered flow update actually needs.
  patchQuestFlows: (params: { questId: string; flows: FlowInput[] }) => Promise<void>;
  rewindQuestStatus: (params: { questFilePath: string; status: string }) => Promise<void>;
  tamperQuestStatusRewind: (params: { questFilePath: string; status: string }) => Promise<void>;
  questFolderExists: (params: { questFilePath: string }) => boolean;
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
      packageNames?: string[];
      workItemId?: string;
      step?: string;
    }[];
    firstWorkItemId: string;
    firstWorkItemStatus?: string;
    firstWorkItemSessionId?: string;
    flowriderScopeSignedOff?: boolean;
    worktreePath?: string;
  }) => Promise<void>;
  // Seeds `pausedAtStatus` on an already-written quest via dmRegistryBroker's setRaw route — same
  // one-field shape as patchQuestStatus above, aimed at the snapshot field questPauseBroker stamps
  // for real. A spec proving what RESUME does with an already-paused quest needs this as a
  // PRECONDITION (the quest was paused before the test's own mutation), not as the mutation itself.
  seedPausedAtStatus: (params: { questId: string; pausedAtStatus: string }) => Promise<void>;
  // RAW ON PURPOSE — same route as pauseQuest above, but hands back the response instead of
  // throwing: a spec asserting the pause route's exact status code AND JSON body (not just that it
  // succeeded) needs both, and pauseQuest deliberately discards them for its own callers, which
  // only want a throw on failure.
  pauseQuestResponse: (params: {
    questId: string;
  }) => Promise<{ status: DmHttpResponse['status']; body: Record<PropertyKey, unknown> }>;
  // RAW ON PURPOSE — the resume counterpart of pauseQuestResponse. 'paused' is deliberately off
  // the quest ingredient's own `transitions.to` (see quest-ingredient-broker.ts's own header), so
  // nothing walks back OUT of it through the framework either — restoring the pre-pause status and
  // deciding whether to restart the global dispatcher are real side effects only
  // POST /api/quests/:questId/resume performs.
  resumeQuestResponse: (params: {
    questId: string;
  }) => Promise<{ status: DmHttpResponse['status']; body: Record<PropertyKey, unknown> }>;
  // RAW ON PURPOSE — dmRegistryBroker's `update` route (patchQuestStatus above) calls
  // questModifyBroker IN-PROCESS (quest-update-route-broker.ts), so it never produces a wire-level
  // HTTP response at all — there is no status code the framework route could ever hand back. A
  // spec asserting the real PATCH /api/quests/:questId response code needs the actual request.
  patchQuestStatusResponse: (params: {
    questId: string;
    status: string;
  }) => Promise<{ status: DmHttpResponse['status'] }>;
  // RAW ON PURPOSE — `merging`/`merged` are deliberately off the quest ingredient's own
  // `transitions.to` list: quest-ingredient-broker.ts's own header names why — "minted only by
  // OrchestrationMergeResponder pressing 'Teleport with Booty' ... the machinery behind both is
  // out of this ingredient's reach." POST /api/quests/:questId/merge — the same route the UI's
  // Teleport with Booty button calls — is the only way onto it. The status and body have to come
  // back RAW too: dmHttpResponseUnwrapAdapter discards the real HTTP status and hands back only
  // the parsed body on success (dispatchHarness.startQuestViaStartRoute's own comment names the
  // same gap for /start), so a spec proving the route's own response shape has no route through
  // the framework for either value.
  mergeQuestViaMergeRoute: (params: {
    questId: string;
  }) => Promise<{ status: DmHttpResponse['status']; body: Record<PropertyKey, unknown> }>;
} => {
  const resolvedBaseUrl =
    baseURL ??
    process.env.DUNGEONMASTER_BASE_URL ??
    `http://${environmentStatics.hostname}:${process.env.DUNGEONMASTER_WEB_PORT ?? String(Number(process.env.DUNGEONMASTER_PORT ?? '5737') + 1)}`;
  const dmTarget = dmTargetHarness({ baseURL: resolvedBaseUrl, request });

  const createQuest = async ({
    guildId,
    title,
    userRequest,
  }: {
    guildId: string;
    title: string;
    userRequest: string;
  }): Promise<{ questId: QuestId; questFolder: QuestId; filePath: FilePath; success: boolean }> => {
    const plan = recipe({ name: 'seed-quest', description: 'seed one quest via api route' }, () => [
      dmRegistryBroker.quests.under({ guildId: guildIdContract.parse(guildId) }).add(1, (q) => [
        q[0].set({
          title: questContract.shape.title.parse(title),
          userRequest: questContract.shape.userRequest.parse(userRequest),
        }),
        q[0].saveRecordAs({ name: QUEST_SAVE_NAME }),
      ]),
    ])();
    const result = await dmRegistryBroker.run(plan, dmTarget.apiTarget());
    const quest = (result as Record<PropertyKey, unknown>)[QUEST_SAVE_NAME] as Quest;
    const dungeonmasterHome = process.env.DUNGEONMASTER_HOME!;
    const questFolderPath = `${dungeonmasterHome}/${dungeonmasterHomeStatics.paths.guildsDir}/${guildId}/${dungeonmasterHomeStatics.paths.questsDir}/${quest.folder}`;
    const filePath = filePathContract.parse(
      `${questFolderPath}/${dungeonmasterHomeStatics.paths.questFile}`,
    );
    return {
      success: true,
      questId: quest.id,
      questFolder: quest.folder as unknown as QuestId,
      filePath,
    };
  };

  // Same plan shape as createQuest, run against the `write` target instead of the `api` one — for
  // a spec proving the two routes produce equivalent domain state for the same ingredient.
  const createQuestViaWriteRoute = async ({
    guildId,
    title,
    userRequest,
  }: {
    guildId: string;
    title: string;
    userRequest: string;
  }): Promise<{ questId: QuestId; questFolder: QuestId; filePath: FilePath }> => {
    const plan = recipe(
      { name: 'seed-quest-write', description: 'seed one quest via write route' },
      () => [
        dmRegistryBroker.quests.under({ guildId: guildIdContract.parse(guildId) }).add(1, (q) => [
          q[0].set({
            title: questContract.shape.title.parse(title),
            userRequest: questContract.shape.userRequest.parse(userRequest),
          }),
          q[0].saveRecordAs({ name: QUEST_SAVE_NAME }),
        ]),
      ],
    )();
    const result = await dmRegistryBroker.run(plan, dmTarget.writeTarget());
    const quest = (result as Record<PropertyKey, unknown>)[QUEST_SAVE_NAME] as Quest;
    const dungeonmasterHome = process.env.DUNGEONMASTER_HOME!;
    const questFolderPath = `${dungeonmasterHome}/${dungeonmasterHomeStatics.paths.guildsDir}/${guildId}/${dungeonmasterHomeStatics.paths.questsDir}/${quest.folder}`;
    const filePath = filePathContract.parse(
      `${questFolderPath}/${dungeonmasterHomeStatics.paths.questFile}`,
    );
    return {
      questId: quest.id,
      questFolder: quest.folder as unknown as QuestId,
      filePath,
    };
  };

  // Builds the quest.json OBJECT SHAPE from a writeQuestFile-style parameter set — no I/O, no
  // contract validation. Shared by writeQuestFile (which validates the result and writes it
  // through dmRegistryBroker) and writeMalformedQuestFile (which writes this same shape straight
  // to disk on purpose), so the two callers can never drift into assembling quest.json two
  // different ways.
  const assembleQuestJsonShape = ({
    questId,
    questFolder,
    title,
    status,
    questType,
    workItems,
    steps,
    userRequest,
    planningNotes,
    flows,
    packagesAffected,
    contracts,
    comments,
    wardResults,
    operations,
    sessions,
    worktreePath,
    branchName,
    baseBranch,
  }: {
    questId: string;
    questFolder: string;
    title: string;
    status: string;
    questType?: string;
    workItems: {
      id: string;
      role: string;
      sessionId?: string;
      agentId?: string;
      status?: string;
      spawnerType?: string;
      step?: string;
      dependsOn?: string[];
      relatedDataItems?: string[];
      insertedBy?: string;
      createdAt?: string;
      completedAt?: string;
      attempt?: number;
      maxAttempts?: number;
      observations?: {
        unitId: string;
        mark: string;
        evidence: string;
        toSettle?: string;
        at?: string;
      }[];
    }[];
    steps: { id: string; name: string }[];
    userRequest: string;
    planningNotes?: PlanningNotesInput;
    flows?: FlowInput[];
    packagesAffected: PackageEntryInput[];
    contracts: ContractEntryInput[];
    comments?: CommentInput[];
    wardResults: {
      id: string;
      exitCode: number;
      wardMode?: string;
      runId?: string;
      createdAt?: string;
    }[];
    operations: {
      id: string;
      role: string;
      text: string;
      status: string;
      locked?: boolean;
      packageNames?: string[];
    }[];
    sessions?: QuestSessionInput[];
    worktreePath?: string;
    branchName?: string;
    baseBranch?: string;
  }): Record<PropertyKey, unknown> => {
    const seededPlanningNotes: PlanningNotesInput = planningNotes ?? {};
    const baseFlows: FlowInput[] = flows ?? DEFAULT_FLOWS;
    const seededFlows: FlowInput[] = questFlowObservableSeedTransformer({
      flows: baseFlows,
      status,
    });

    return {
      id: questId,
      folder: questFolder,
      title,
      status,
      ...(questType === undefined ? {} : { questType }),
      ...(worktreePath === undefined ? {} : { worktreePath }),
      ...(branchName === undefined ? {} : { branchName }),
      ...(baseBranch === undefined ? {} : { baseBranch }),
      createdAt: new Date().toISOString(),
      workItems: workItems.map((wi, index) => ({
        id: wi.id,
        role: wi.role,
        status: wi.status ?? 'complete',
        spawnerType: wi.spawnerType ?? 'agent',
        ...(wi.step === undefined ? {} : { step: wi.step }),
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
        ...(wi.observations === undefined
          ? {}
          : {
              observations: wi.observations.map((obs) => ({
                unitId: obs.unitId,
                mark: obs.mark,
                evidence: obs.evidence,
                ...(obs.toSettle === undefined ? {} : { toSettle: obs.toSettle }),
                at: obs.at ?? new Date().toISOString(),
              })),
            }),
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
      ...(sessions === undefined ? {} : { sessions }),
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
      })),
    };
  };

  const writeQuestFile = async ({
    guildId,
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
    sessions,
    worktreePath,
    branchName,
    baseBranch,
  }: {
    guildId?: string;
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
      // The `agentFlowStatics` step this item is running. A work item carrying one belongs to
      // `questRouteScopeBroker`, which takes that step's own route; one carrying none runs no step
      // graph at all and its own `signal-back` completes the scope it links to.
      step?: string;
      dependsOn?: string[];
      relatedDataItems?: string[];
      insertedBy?: string;
      createdAt?: string;
      completedAt?: string;
      attempt?: number;
      maxAttempts?: number;
      // The sign-off record `questSummaryBuildTransformer` reads per (unit, track) —
      // `unitObservationContract`'s own fields (`packages/shared/src/contracts/unit-observation/`),
      // restated as plain input like every other field here. `toSettle` is valid ONLY on
      // `mark: 'cant-meet'` and OMITTED (never sent as `undefined`) otherwise — `questContract`'s
      // `safeParse` inside `writeQuestFile` is what enforces that pairing and every other shape
      // rule; this type does not.
      observations?: {
        unitId: string;
        mark: string;
        evidence: string;
        toSettle?: string;
        at?: string;
      }[];
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
      packageNames?: string[];
    }[];
    // The quest's own session ledger. Seed a row per session whose transcript the spec expects to
    // read back; the key is OMITTED when the caller names none, so every other fixture still proves
    // questContract defaults it to []. A session with no row here falls back to the per-quest cwd.
    sessions?: QuestSessionInput[];
    // The git context riftcarver writes when it carves. Seed these to stand a quest up in the
    // state EVERY role after riftcarver actually runs in: its sessions run in the worktree, and
    // Claude CLI encodes its JSONL directory from the child's cwd, so the server resolves that
    // session's tail through `worktreePath` rather than the guild path. A fixture that leaves them
    // unset can only ever exercise the pre-carve arrangement.
    worktreePath?: string;
    branchName?: string;
    baseBranch?: string;
  }): Promise<void> => {
    // Every optional property below is a conditional spread, never a plain shorthand: a
    // destructured optional param's local type is `T | undefined`, and `assembleQuestJsonShape`'s
    // own param type declares each as `T?` (absent-or-T, never present-as-undefined) —
    // `exactOptionalPropertyTypes` rejects the shorthand form outright.
    const rawQuest = assembleQuestJsonShape({
      questId,
      questFolder,
      title,
      status,
      ...(questType === undefined ? {} : { questType }),
      workItems,
      steps,
      userRequest,
      ...(planningNotes === undefined ? {} : { planningNotes }),
      ...(flows === undefined ? {} : { flows }),
      packagesAffected,
      contracts,
      ...(comments === undefined ? {} : { comments }),
      wardResults,
      operations,
      ...(sessions === undefined ? {} : { sessions }),
      ...(worktreePath === undefined ? {} : { worktreePath }),
      ...(branchName === undefined ? {} : { branchName }),
      ...(baseBranch === undefined ? {} : { baseBranch }),
    });

    // Every write goes through dmRegistryBroker — no raw-fs fallback. A shape the framework
    // cannot write (an unparseable guild id, a quest.json that does not fit questContract) is a
    // loud, named throw here, not a silent drop to a hand-rolled fs.writeFile: a fallback that
    // never reports it fired is worse than an unconverted method, because a spec passes on the
    // fallback path while asserting nothing about the real write route.
    const inferredGuildId = guildId ?? basename(dirname(dirname(dirname(questFilePath))));
    const parsedGuildId = guildIdContract.safeParse(inferredGuildId);
    if (!parsedGuildId.success) {
      throw new Error(
        `questHarness.writeQuestFile: could not write quest "${questId}" — guild id ` +
          `"${inferredGuildId}" does not parse as guildIdContract: ${parsedGuildId.error.message}`,
      );
    }

    const parsedQuest = questContract.safeParse(rawQuest);
    if (!parsedQuest.success) {
      throw new Error(
        `questHarness.writeQuestFile: could not write quest "${questId}" — the assembled shape ` +
          `does not parse as questContract, so dmRegistryBroker's quest ingredient cannot write ` +
          `it: ${parsedQuest.error.message}`,
      );
    }

    const questPayload = {
      ...parsedQuest.data,
      id: questIdContract.parse(questId),
      folder: questContract.shape.folder.parse(questFolder),
    };

    const plan = recipe(
      { name: 'write-quest-file', description: 'write quest file via dmRegistryBroker' },
      () => [
        dmRegistryBroker.quests
          .under({ guildId: parsedGuildId.data })
          .add(1, (q) => [q[0].setRaw(questPayload)]),
      ],
    )();

    await dmRegistryBroker.run(plan, dmTarget.writeTarget());
  };

  // Writes the SAME shape writeQuestFile assembles, straight to disk — no questContract
  // validation, no dmRegistryBroker route. writeQuestFile refuses a shape questContract rejects
  // (a loud throw, deliberately: see its own comment), so a spec proving the SERVER's own
  // read-time rejection needs a way onto disk that does not go through that refusal.
  // malformed-quest-file-reported.e2e.ts is this method's only caller — reach for
  // writeQuestFile everywhere else, including for a quest this method's caller expects to fail:
  // a fallback silently reused by every caller is what let a spec pass on the fallback path
  // while asserting nothing about the real write route.
  const writeMalformedQuestFile = async ({
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
    sessions,
    worktreePath,
    branchName,
    baseBranch,
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
      step?: string;
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
      packageNames?: string[];
    }[];
    sessions?: QuestSessionInput[];
    worktreePath?: string;
    branchName?: string;
    baseBranch?: string;
  }): Promise<void> => {
    const rawQuest = assembleQuestJsonShape({
      questId,
      questFolder,
      title,
      status,
      ...(questType === undefined ? {} : { questType }),
      workItems,
      steps,
      userRequest,
      ...(planningNotes === undefined ? {} : { planningNotes }),
      ...(flows === undefined ? {} : { flows }),
      packagesAffected,
      contracts,
      ...(comments === undefined ? {} : { comments }),
      wardResults,
      operations,
      ...(sessions === undefined ? {} : { sessions }),
      ...(worktreePath === undefined ? {} : { worktreePath }),
      ...(branchName === undefined ? {} : { branchName }),
      ...(baseBranch === undefined ? {} : { baseBranch }),
    });

    await fsPromises.mkdir(dirname(questFilePath), { recursive: true });
    await fsPromises.writeFile(questFilePath, JSON.stringify(rawQuest, null, JSON_INDENT));

    // Append a quest-modified event to the outbox so the HTTP server's quest-driven watcher
    // reactor reconciles immediately, exactly as questPersistBroker does in production — see
    // writeQuestFile's own broker route, which gets this for free through dmRegistryBroker.
    const dungeonmasterHome = dirname(dirname(dirname(dirname(questFilePath))));
    await fsPromises.appendFile(
      `${dungeonmasterHome}/event-outbox.jsonl`,
      `${JSON.stringify({ questId, timestamp: new Date().toISOString() })}\n`,
    );
  };

  // Writes a quest.json that questContract REJECTS, into a real quest folder the guild's
  // quests dir enumerates. Mirrors a file written by an older schema: a workItem role that is
  // no longer in workItemRoleContract plus relatedDataItems as bare uuids instead of the
  // `{collection}/{id}` shape. Used to prove one such file cannot take the whole guild's quest
  // list — and therefore the dispatcher's active-quest scan — down with it.
  const tamperQuestUnparseableFile = async ({
    questId,
    questFolder,
    questFilePath,
  }: {
    questId: string;
    questFolder: string;
    questFilePath: string;
  }): Promise<void> => {
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

    await fsPromises.writeFile(questFilePath, JSON.stringify(quest, null, JSON_INDENT));
  };

  const writeWardResultDetail = async ({
    questFilePath,
    wardResultId,
    detail,
  }: {
    questFilePath: string;
    wardResultId: string;
    detail: Record<PropertyKey, unknown>;
  }): Promise<void> => {
    // The server's ward-detail endpoint reads <questFolder>/ward-results/<id>.json. The quest
    // folder is the directory holding quest.json.
    const wardResultsDir = join(dirname(questFilePath), 'ward-results');
    await fsPromises.mkdir(wardResultsDir, { recursive: true });
    await fsPromises.writeFile(
      join(wardResultsDir, `${wardResultId}.json`),
      JSON.stringify(detail, null, JSON_INDENT),
    );
  };

  // A quest's parent is its FOLDER, never a field on the record — dmRegistryBroker's quest
  // ingredient can only reach an existing row through its `guildId` link (see
  // packages/hydration-recipes/src/brokers/quest/query-route/quest-query-route-broker.ts), and
  // there is no framework verb that resolves an owning guild from a bare id (the same gap
  // hydration-recipes' own `questOwningGuildFindBroker` exists to close — internal to that
  // package, unreachable from here). This mirrors that broker's own algorithm — scan every guild's
  // quest list for the id — over the one surface this harness can reach: the real HTTP API.
  const resolveQuestOwningGuildId = async ({ questId }: { questId: string }): Promise<GuildId> => {
    const guildsResponse = await request.get('/api/guilds');
    const guildsBody = (await guildsResponse.json()) as ApiListRecord[];
    const guilds = Array.isArray(guildsBody) ? guildsBody : [];

    const owningGuildId = await guilds.reduce<Promise<GuildId | undefined>>(
      async (previous, guild) => {
        const found = await previous;
        if (found !== undefined) {
          return found;
        }
        const candidateGuildId = guildIdContract.parse(String(guild.id));
        const questsResponse = await request.get(`/api/quests?guildId=${candidateGuildId}`);
        const questsBody = (await questsResponse.json()) as Record<PropertyKey, unknown>;
        const questsRaw = questsBody.quests;
        const quests = Array.isArray(questsRaw) ? (questsRaw as ApiListRecord[]) : [];
        return quests.some((quest) => String(quest.id) === questId) ? candidateGuildId : undefined;
      },
      Promise.resolve(undefined),
    );

    if (owningGuildId === undefined) {
      throw new Error(
        `questHarness.patchQuestStatus: no guild owns quest "${questId}" — checked every guild ` +
          `GET /api/guilds returned`,
      );
    }

    return owningGuildId;
  };

  const patchQuestStatus = async ({
    questId,
    status,
  }: {
    questId: string;
    status: string;
  }): Promise<void> => {
    const guildId = await resolveQuestOwningGuildId({ questId });
    const parsedStatus = questContract.shape.status.parse(status);

    // `id` is not a QuestFields key (a quest's id is server-minted, never settable) even though
    // questQueryRouteBroker's own matchesWhereClauseGuard matches it at RUN time — a query's
    // `where` reaches wider than the settable-fields type the chain otherwise enforces. The
    // intersection bridges that modelling gap without an `as unknown as`: `where`'s own type has
    // no index signature, so intersecting in `id` widens the TARGET type instead of asserting
    // past it — branded `QuestId`, never a bare `string`, so `@dungeonmaster/ban-primitives` (which
    // allows a raw primitive only directly in a parameter position, never in a type alias's own
    // body) has no bare primitive to flag here either.
    type QuestFilterWhere = Parameters<typeof dmRegistryBroker.quests.filter>[0]['where'] & {
      id?: QuestId;
    };
    const filterWhere: QuestFilterWhere = { guildId, id: questIdContract.parse(questId) };

    const plan = recipe(
      {
        name: 'patch-quest-status',
        description: "writes an existing quest's status field via dmRegistryBroker",
      },
      () => [
        dmRegistryBroker.quests
          .filter({ where: filterWhere, expect: 'one' })
          .setRaw({ status: parsedStatus }),
      ],
    )();

    await dmRegistryBroker.run(plan, dmTarget.apiTarget());
  };

  // Walks a quest from its current (live) status to 'in_progress' via dmRegistryBroker's
  // transitions.reach. That reach function is questReachRouteBroker, which for this one hop skips
  // questModifyBroker entirely and calls the real POST /api/quests/:questId/start — seeding the
  // operations relay and enqueuing the quest exactly as OrchestrationStartResponder does. See
  // quest-ingredient-broker.ts's own header for the full reasoning.
  const startQuest = async ({ questId }: { questId: string }): Promise<void> => {
    const guildId = await resolveQuestOwningGuildId({ questId });

    // Same intersection as patchQuestStatus's own filterWhere: `id` is not a QuestFields key, so
    // widening the target type (never asserting past it) is what lets a branded QuestId sit beside
    // the link-derived `guildId` in one `where` clause.
    type QuestFilterWhere = Parameters<typeof dmRegistryBroker.quests.filter>[0]['where'] & {
      id?: QuestId;
    };
    const filterWhere: QuestFilterWhere = { guildId, id: questIdContract.parse(questId) };

    const plan = recipe(
      {
        name: 'start-quest',
        description: 'walks a quest to in_progress via the real POST /start route',
      },
      () => [
        dmRegistryBroker.quests.filter({ where: filterWhere, expect: 'one' }).set({
          status: 'in_progress',
        }),
      ],
    )();

    await dmRegistryBroker.run(plan, dmTarget.apiTarget());
  };

  // RAW ON PURPOSE — questIngredientBroker's own header names this as a real, documented gap
  // rather than an oversight: 'paused' is deliberately off `transitions.to` because
  // questModifyBroker refuses a bare `status: 'paused'` write by name, and reaching it for real
  // requires killing every registered subprocess through `state/`, which this package cannot
  // import. POST /api/quests/:questId/pause is the only route onto it.
  const pauseQuest = async ({ questId }: { questId: string }): Promise<void> => {
    const pauseRoute = `/api/quests/${questId}/pause`;
    const response = await request.post(pauseRoute);
    if (!response.ok()) {
      throw new Error(
        `questHarness.pauseQuest: ${pauseRoute} answered ${String(response.status())}`,
      );
    }
  };

  // RAW ON PURPOSE — the opposite gap from pauseQuest above: this PATCHes a quest to the STATUS IT
  // ALREADY HAS, purely to make the server's real persist-and-broadcast path (questPersistBroker)
  // re-read quest.json and push the update over the websocket. patchQuestStatus's setRaw writes
  // through dmRegistryBroker's hydration route, which by its own header above fires none of the
  // real PATCH route's side effects — the WS broadcast is exactly the side effect callers of this
  // method want, so setRaw cannot substitute for it. PATCH /api/quests/:questId is the only route
  // onto it. Reach for this after a harness write that lands quest.json from THIS Node process
  // (e.g. elapsedDurationHarness.stampWorkItems) rather than from questPersistBroker itself, whose
  // own cross-process outbox append does not reliably wake a watcher that subscribed before it
  // landed.
  const forceStatusRebroadcast = async ({
    questId,
    status,
  }: {
    questId: string;
    status: string;
  }): Promise<void> => {
    const rebroadcastRoute = `/api/quests/${questId}`;
    const response = await request.patch(rebroadcastRoute, { data: { status } });
    if (!response.ok()) {
      throw new Error(
        `questHarness.forceStatusRebroadcast: ${rebroadcastRoute} answered ${String(response.status())}`,
      );
    }
  };

  // RAW ON PURPOSE — same cross-process gap as forceStatusRebroadcast above: dmRegistryBroker's
  // `update` route calls questModifyBroker in THIS test process, and its questPersistBroker outbox
  // append is therefore cross-process relative to the real dev server hosting
  // orchestratorOutboxWatchAdapter — "does not reliably wake a watcher that subscribed before it
  // landed" (forceStatusRebroadcast's own comment above). PATCH /api/quests/:questId run through
  // the server's own HTTP handler is what appends the outbox INSIDE that process, which is what a
  // spec asserting on the WS-delivered flow update actually needs.
  const patchQuestFlows = async ({
    questId,
    flows,
  }: {
    questId: string;
    flows: FlowInput[];
  }): Promise<void> => {
    const patchRoute = `/api/quests/${questId}`;
    const response = await request.patch(patchRoute, { data: { flows } });
    if (!response.ok()) {
      throw new Error(
        `questHarness.patchQuestFlows: ${patchRoute} answered ${String(response.status())}`,
      );
    }
  };

  // Rewrites ONLY the `status` field of an existing quest.json, leaving every other byte — the
  // seeded operations ledger, the work items, the package graph — exactly as the SERVER wrote it,
  // then appends the same quest-modified outbox line questPersistBroker would so the watcher
  // reconciles immediately. Reach for this over writeQuestFile whenever the state under test is one
  // the server produced and the fixture only needs to move the quest back across a gate:
  // writeQuestFile rebuilds a quest from its own defaults, so round-tripping a server-written quest
  // through it silently drops everything its parameter list does not name.
  const tamperQuestStatusRewind = async ({
    questFilePath,
    status,
  }: {
    questFilePath: string;
    status: string;
  }): Promise<void> => {
    const persisted = JSON.parse(
      await fsPromises.readFile(questFilePath, 'utf8'),
    ) as PersistedQuestInput;

    await fsPromises.writeFile(
      questFilePath,
      JSON.stringify({ ...persisted, status }, null, JSON_INDENT),
    );

    const dungeonmasterHome = dirname(dirname(dirname(dirname(questFilePath))));
    await fsPromises.appendFile(
      `${dungeonmasterHome}/event-outbox.jsonl`,
      `${JSON.stringify({ questId: String(persisted.id), timestamp: new Date().toISOString() })}\n`,
    );
  };

  // The quest folder is the directory holding quest.json — i.e. dirname(questFilePath),
  // which resolves to <DUNGEONMASTER_HOME>/guilds/<guildId>/quests/<questFolder>/. The
  // backend delete removes this folder recursively, so a UI delete should leave it absent.
  const questFolderExists = ({ questFilePath }: { questFilePath: string }): boolean =>
    existsSync(dirname(questFilePath));

  // Seeds a quest directly to `in_progress` with an operations ledger + ONE work item linked 1:1 to
  // the first operation item (relatedDataItems: ['operations/<op0.id>']) — mirroring a quest whose
  // Start Quest transition already seeded the relay. The first operation item is expected to be
  // `in_progress` and the linked work item `pending` (dispatch pre-stamps it in_progress on spawn).
  //
  // A LATER operation gets a seeded work item too when it names its own `workItemId`, chained on the
  // previous seeded item through `dependsOn` so the relay dispatches them one at a time in ledger
  // order. That is what a ledger written up front needs: `questAdvanceBroker` opens ONE scope at a
  // time and stamps every item it mints with its family's ENTRY step, so a scope left for advance to
  // open is a scope the ROUTER then owns. Seeding the item is how a spec says "this scope runs no
  // step graph"; omitting it is how a spec says "let advance enter this one at its entry step".
  const seedInProgressWithOperations = async ({
    questId,
    questFolder,
    questFilePath,
    title,
    operations,
    firstWorkItemId,
    firstWorkItemStatus = 'pending',
    firstWorkItemSessionId,
    flowriderScopeSignedOff = false,
    worktreePath,
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
      packageNames?: string[];
      // Seeds this scope its OWN work item, beyond the first operation's. Chained on the previous
      // seeded item, so the relay dispatches the ledger serially.
      workItemId?: string;
      // The step that work item carries. Omit it for a scope that runs no step graph.
      step?: string;
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
    // Seeds the quest as ALREADY CARVED. Set it whenever the ledger's riftcarver item is seeded
    // complete, because that is the only arrangement in which the roles after it run where they
    // really run — in the worktree, writing their session JSONL under the worktree's own path
    // encoding.
    worktreePath?: string;
  }): Promise<void> => {
    const [firstOp] = operations;
    if (firstOp === undefined) {
      throw new Error('seedInProgressWithOperations requires at least one operation');
    }

    const seededWorkItems = operations.flatMap((op, index) => {
      const id = index === 0 ? firstWorkItemId : op.workItemId;
      if (id === undefined) {
        return [];
      }

      return [
        {
          id,
          role: op.role,
          status: index === 0 ? firstWorkItemStatus : 'pending',
          spawnerType: isCommandWorkItemRoleGuard({ role: op.role as WorkItemRole })
            ? 'command'
            : 'agent',
          relatedDataItems: [`operations/${op.id}`],
          ...(op.step === undefined ? {} : { step: op.step }),
          ...(index === 0 && firstWorkItemSessionId !== undefined
            ? { sessionId: firstWorkItemSessionId }
            : {}),
        },
      ];
    });

    await writeQuestFile({
      questId,
      questFolder,
      questFilePath,
      ...(title === undefined ? {} : { title }),
      status: 'in_progress',
      operations,
      ...(flowriderScopeSignedOff ? { flows: DEFAULT_FLOWS_FLOWRIDER_SIGNED } : {}),
      ...(worktreePath === undefined ? {} : { worktreePath }),
      workItems: seededWorkItems.map((workItem, index) => {
        const previous = seededWorkItems[index - 1];

        return previous === undefined ? workItem : { ...workItem, dependsOn: [previous.id] };
      }),
    });
  };

  // Seeds `pausedAtStatus` via dmRegistryBroker's setRaw route — same filter-then-setRaw shape as
  // patchQuestStatus above, aimed at the one field questPauseBroker stamps for real (a snapshot of
  // the pre-pause status). Reach for this when a spec needs a quest that is ALREADY paused with a
  // known snapshot as its starting state — never to perform the pause itself, which is what
  // pauseQuest (the real POST route) is for.
  const seedPausedAtStatus = async ({
    questId,
    pausedAtStatus,
  }: {
    questId: string;
    pausedAtStatus: string;
  }): Promise<void> => {
    const guildId = await resolveQuestOwningGuildId({ questId });
    const parsedPausedAtStatus = questContract.shape.pausedAtStatus.parse(pausedAtStatus);

    // Same intersection as patchQuestStatus's own filterWhere: `id` is not a QuestFields key, so
    // widening the target type (never asserting past it) is what lets a branded QuestId sit beside
    // the link-derived `guildId` in one `where` clause.
    type QuestFilterWhere = Parameters<typeof dmRegistryBroker.quests.filter>[0]['where'] & {
      id?: QuestId;
    };
    const filterWhere: QuestFilterWhere = { guildId, id: questIdContract.parse(questId) };

    const plan = recipe(
      {
        name: 'seed-paused-at-status',
        description: "seeds an existing quest's pausedAtStatus field via dmRegistryBroker",
      },
      () => [
        dmRegistryBroker.quests
          .filter({ where: filterWhere, expect: 'one' })
          .setRaw({ pausedAtStatus: parsedPausedAtStatus }),
      ],
    )();

    await dmRegistryBroker.run(plan, dmTarget.apiTarget());
  };

  // RAW ON PURPOSE — see this method's own header on the return-type block above: `merging` has
  // no dmRegistryBroker route, and the literal status/body are what a caller proving the merge
  // route's own response shape needs back.
  const mergeQuestViaMergeRoute = async ({
    questId,
  }: {
    questId: string;
  }): Promise<{ status: DmHttpResponse['status']; body: Record<PropertyKey, unknown> }> => {
    const mergeRoute = `/api/quests/${questId}/merge`;
    const response = await request.post(mergeRoute);
    const body = (await response.json()) as Record<PropertyKey, unknown>;
    return {
      status: dmHttpResponseContract.shape.status.parse(response.status()),
      body,
    };
  };

  // RAW ON PURPOSE — same route as pauseQuest above, but hands back the response instead of
  // throwing: a spec asserting the pause route's exact status code AND JSON body (not just that it
  // succeeded) needs both, and pauseQuest deliberately discards them for its own callers, which
  // only want a throw on failure.
  const pauseQuestResponse = async ({
    questId,
  }: {
    questId: string;
  }): Promise<{ status: DmHttpResponse['status']; body: Record<PropertyKey, unknown> }> => {
    const pauseRoute = `/api/quests/${questId}/pause`;
    const response = await request.post(pauseRoute);
    const body = (await response.json()) as Record<PropertyKey, unknown>;
    return {
      status: dmHttpResponseContract.shape.status.parse(response.status()),
      body,
    };
  };

  // RAW ON PURPOSE — the resume counterpart of pauseQuestResponse. 'paused' is deliberately off
  // the quest ingredient's own `transitions.to` (see quest-ingredient-broker.ts's own header), so
  // nothing walks back OUT of it through the framework either — restoring the pre-pause status and
  // deciding whether to restart the global dispatcher are real side effects only
  // POST /api/quests/:questId/resume performs.
  const resumeQuestResponse = async ({
    questId,
  }: {
    questId: string;
  }): Promise<{ status: DmHttpResponse['status']; body: Record<PropertyKey, unknown> }> => {
    const resumeRoute = `/api/quests/${questId}/resume`;
    const response = await request.post(resumeRoute);
    const body = (await response.json()) as Record<PropertyKey, unknown>;
    return {
      status: dmHttpResponseContract.shape.status.parse(response.status()),
      body,
    };
  };

  // RAW ON PURPOSE — dmRegistryBroker's `update` route (patchQuestStatus above) calls
  // questModifyBroker IN-PROCESS (quest-update-route-broker.ts), so it never produces a wire-level
  // HTTP response at all — there is no status code the framework route could ever hand back. A
  // spec asserting the real PATCH /api/quests/:questId response code needs the actual request.
  const patchQuestStatusResponse = async ({
    questId,
    status,
  }: {
    questId: string;
    status: string;
  }): Promise<{ status: DmHttpResponse['status'] }> => {
    const patchRoute = `/api/quests/${questId}`;
    const response = await request.patch(patchRoute, { data: { status } });
    return { status: dmHttpResponseContract.shape.status.parse(response.status()) };
  };

  return {
    createQuest,
    createQuestViaWriteRoute,
    writeQuestFile,
    writeMalformedQuestFile,
    writeUnparseableQuestFile: tamperQuestUnparseableFile,
    tamperQuestUnparseableFile,
    writeWardResultDetail,
    patchQuestStatus,
    startQuest,
    pauseQuest,
    forceStatusRebroadcast,
    patchQuestFlows,
    rewindQuestStatus: tamperQuestStatusRewind,
    tamperQuestStatusRewind,
    questFolderExists,
    seedInProgressWithOperations,
    seedPausedAtStatus,
    mergeQuestViaMergeRoute,
    pauseQuestResponse,
    resumeQuestResponse,
    patchQuestStatusResponse,
  };
};
