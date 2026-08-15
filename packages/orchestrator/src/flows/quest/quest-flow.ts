/**
 * PURPOSE: Orchestrates quest operations by delegating to quest responders
 *
 * USAGE:
 * const result = await QuestFlow.add({ title, userRequest, guildId });
 * const quest = await QuestFlow.get({ questId, stage });
 * const items = await QuestFlow.list({ guildId });
 * const listing = await QuestFlow.listWithSkips({ guildId });
 * const fullQuest = await QuestFlow.load({ questId });
 * const modified = await QuestFlow.modify({ questId, input });
 * const notes = await QuestFlow.getPlanningNotes({ questId });
 * const summary = await QuestFlow.getSummary({ questId });
 * const checklist = await QuestFlow.getQaChecklist({ questId, flowId, track });
 * const blightChecklist = await QuestFlow.getBlightChecklist({ questId });
 * const walkReset = await QuestFlow.resetFlowSignoffs({ questId, workItemId, flowId, reason });
 * const created = await QuestFlow.mcpCreate({ userRequest });
 * const next = await QuestFlow.getNextStep();
 * const wardResult = await QuestFlow.runWard({ questId, workItemId, mode });
 * const config = QuestFlow.getServerConfig();
 */

import { QuestUserAddResponder } from '../../responders/quest/user-add/quest-user-add-responder';
import { QuestFindBySessionIdResponder } from '../../responders/quest/find-by-session-id/quest-find-by-session-id-responder';
import { QuestFindByWorkItemIdResponder } from '../../responders/quest/find-by-work-item-id/quest-find-by-work-item-id-responder';
import { QuestGetResponder } from '../../responders/quest/get/quest-get-responder';
import { QuestGetBlightChecklistResponder } from '../../responders/quest/get-blight-checklist/quest-get-blight-checklist-responder';
import { QuestGetNextStepResponder } from '../../responders/quest/get-next-step/quest-get-next-step-responder';
import { QuestGetPlanningNotesResponder } from '../../responders/quest/get-planning-notes/quest-get-planning-notes-responder';
import { QuestGetQaChecklistResponder } from '../../responders/quest/get-qa-checklist/quest-get-qa-checklist-responder';
import { QuestGetServerConfigResponder } from '../../responders/quest/get-server-config/quest-get-server-config-responder';
import { QuestGetSummaryResponder } from '../../responders/quest/get-summary/quest-get-summary-responder';
import { QuestHandleSignalBackResponder } from '../../responders/quest/handle-signal-back/quest-handle-signal-back-responder';
import { QuestListResponder } from '../../responders/quest/list/quest-list-responder';
import { QuestListWithSkipsResponder } from '../../responders/quest/list-with-skips/quest-list-with-skips-responder';
import { QuestLoadResponder } from '../../responders/quest/load/quest-load-responder';
import { QuestMcpCreateResponder } from '../../responders/quest/mcp-create/quest-mcp-create-responder';
import { QuestModifyResponder } from '../../responders/quest/modify/quest-modify-responder';
import { QuestMonitorWatcherStartResponder } from '../../responders/quest/monitor-watcher-start/quest-monitor-watcher-start-responder';
import { QuestResetFlowSignoffsResponder } from '../../responders/quest/reset-flow-signoffs/quest-reset-flow-signoffs-responder';
import { QuestRunWardResponder } from '../../responders/quest/run-ward/quest-run-ward-responder';

type AddParams = Parameters<typeof QuestUserAddResponder>[0];
type AddResult = Awaited<ReturnType<typeof QuestUserAddResponder>>;

type GetParams = Parameters<typeof QuestGetResponder>[0];
type GetResult = Awaited<ReturnType<typeof QuestGetResponder>>;

type GetPlanningNotesParams = Parameters<typeof QuestGetPlanningNotesResponder>[0];
type GetPlanningNotesResult = Awaited<ReturnType<typeof QuestGetPlanningNotesResponder>>;

type GetSummaryParams = Parameters<typeof QuestGetSummaryResponder>[0];
type GetSummaryResult = Awaited<ReturnType<typeof QuestGetSummaryResponder>>;

type GetQaChecklistParams = Parameters<typeof QuestGetQaChecklistResponder>[0];
type GetQaChecklistResult = Awaited<ReturnType<typeof QuestGetQaChecklistResponder>>;

type GetBlightChecklistParams = Parameters<typeof QuestGetBlightChecklistResponder>[0];
type GetBlightChecklistResult = Awaited<ReturnType<typeof QuestGetBlightChecklistResponder>>;

type ResetFlowSignoffsParams = Parameters<typeof QuestResetFlowSignoffsResponder>[0];
type ResetFlowSignoffsResult = Awaited<ReturnType<typeof QuestResetFlowSignoffsResponder>>;

type ListParams = Parameters<typeof QuestListResponder>[0];
type ListResult = Awaited<ReturnType<typeof QuestListResponder>>;

type ListWithSkipsParams = Parameters<typeof QuestListWithSkipsResponder>[0];
type ListWithSkipsResult = Awaited<ReturnType<typeof QuestListWithSkipsResponder>>;

type LoadParams = Parameters<typeof QuestLoadResponder>[0];
type LoadResult = Awaited<ReturnType<typeof QuestLoadResponder>>;

type ModifyParams = Parameters<typeof QuestModifyResponder>[0];
type ModifyResult = Awaited<ReturnType<typeof QuestModifyResponder>>;

type McpCreateParams = Parameters<typeof QuestMcpCreateResponder>[0];
type McpCreateResult = Awaited<ReturnType<typeof QuestMcpCreateResponder>>;

type GetNextStepResult = Awaited<ReturnType<typeof QuestGetNextStepResponder>>;

type RunWardParams = Parameters<typeof QuestRunWardResponder>[0];
type RunWardResult = Awaited<ReturnType<typeof QuestRunWardResponder>>;

type HandleSignalBackParams = Parameters<typeof QuestHandleSignalBackResponder>[0];
type HandleSignalBackResult = Awaited<ReturnType<typeof QuestHandleSignalBackResponder>>;

type GetServerConfigResult = ReturnType<typeof QuestGetServerConfigResponder>;

type FindBySessionIdParams = Parameters<typeof QuestFindBySessionIdResponder>[0];
type FindBySessionIdResult = Awaited<ReturnType<typeof QuestFindBySessionIdResponder>>;

type FindByWorkItemIdParams = Parameters<typeof QuestFindByWorkItemIdResponder>[0];
type FindByWorkItemIdResult = Awaited<ReturnType<typeof QuestFindByWorkItemIdResponder>>;

type StartMonitorWatcherParams = Parameters<typeof QuestMonitorWatcherStartResponder>[0];
type StartMonitorWatcherResult = Awaited<ReturnType<typeof QuestMonitorWatcherStartResponder>>;

export const QuestFlow = {
  add: async ({ title, userRequest, guildId }: AddParams): Promise<AddResult> =>
    QuestUserAddResponder({ title, userRequest, guildId }),

  get: async ({ questId, stage }: GetParams): Promise<GetResult> =>
    QuestGetResponder({ questId, ...(stage !== undefined && { stage }) }),

  getPlanningNotes: async ({
    questId,
    section,
  }: GetPlanningNotesParams): Promise<GetPlanningNotesResult> =>
    QuestGetPlanningNotesResponder({ questId, ...(section !== undefined && { section }) }),

  getSummary: async ({ questId }: GetSummaryParams): Promise<GetSummaryResult> =>
    QuestGetSummaryResponder({ questId }),

  getQaChecklist: async ({
    questId,
    flowId,
    track,
    packageNames,
  }: GetQaChecklistParams): Promise<GetQaChecklistResult> =>
    QuestGetQaChecklistResponder({
      questId,
      ...(flowId !== undefined && { flowId }),
      ...(track !== undefined && { track }),
      ...(packageNames !== undefined && { packageNames }),
    }),

  getBlightChecklist: async ({
    questId,
    scope,
  }: GetBlightChecklistParams): Promise<GetBlightChecklistResult> =>
    QuestGetBlightChecklistResponder({ questId, ...(scope !== undefined && { scope }) }),

  resetFlowSignoffs: async ({
    questId,
    workItemId,
    flowId,
    reason,
  }: ResetFlowSignoffsParams): Promise<ResetFlowSignoffsResult> =>
    QuestResetFlowSignoffsResponder({ questId, workItemId, flowId, reason }),

  list: async ({ guildId }: ListParams): Promise<ListResult> => QuestListResponder({ guildId }),

  listWithSkips: async ({ guildId }: ListWithSkipsParams): Promise<ListWithSkipsResult> =>
    QuestListWithSkipsResponder({ guildId }),

  load: async ({ questId }: LoadParams): Promise<LoadResult> => QuestLoadResponder({ questId }),

  modify: async ({ questId, input }: ModifyParams): Promise<ModifyResult> =>
    QuestModifyResponder({ questId, input }),

  mcpCreate: async ({
    userRequest,
    questType,
    sessionId,
  }: McpCreateParams): Promise<McpCreateResult> =>
    QuestMcpCreateResponder({
      userRequest,
      ...(questType !== undefined && { questType }),
      ...(sessionId !== undefined && { sessionId }),
    }),

  getNextStep: async (): Promise<GetNextStepResult> => QuestGetNextStepResponder(),

  runWard: async ({ questId, workItemId, mode }: RunWardParams): Promise<RunWardResult> =>
    QuestRunWardResponder({ questId, workItemId, mode }),

  handleSignalBack: async ({
    questId,
    workItemId,
    signal,
    operationItemId,
    operationStatus,
    blockedReason,
  }: HandleSignalBackParams): Promise<HandleSignalBackResult> =>
    QuestHandleSignalBackResponder({
      questId,
      workItemId,
      signal,
      ...(operationItemId === undefined ? {} : { operationItemId }),
      ...(operationStatus === undefined ? {} : { operationStatus }),
      ...(blockedReason === undefined ? {} : { blockedReason }),
    }),

  getServerConfig: (): GetServerConfigResult => QuestGetServerConfigResponder(),

  findBySessionId: async ({ sessionId }: FindBySessionIdParams): Promise<FindBySessionIdResult> =>
    QuestFindBySessionIdResponder({ sessionId }),

  findByWorkItemId: async ({
    workItemId,
  }: FindByWorkItemIdParams): Promise<FindByWorkItemIdResult> =>
    QuestFindByWorkItemIdResponder({ workItemId }),

  startMonitorWatcher: async ({
    parentSessionId,
    projectDir,
    workerWorkItemId,
    workerQuestId,
  }: StartMonitorWatcherParams): Promise<StartMonitorWatcherResult> =>
    QuestMonitorWatcherStartResponder({
      parentSessionId,
      projectDir,
      ...(workerWorkItemId === undefined ? {} : { workerWorkItemId }),
      ...(workerQuestId === undefined ? {} : { workerQuestId }),
    }),
};
