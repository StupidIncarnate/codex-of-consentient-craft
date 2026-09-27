/**
 * PURPOSE: The orchestrator package's own cross-package proxy (brands doc T6, EPIC.md concession 2)
 * — every `StartOrchestrator` method a caller in `mcp` or `server` invokes, mocked once here so both
 * packages compose THIS handle instead of each re-registering `StartOrchestrator.<method>` in their
 * own proxy. Import it per file: `@dungeonmaster/orchestrator/startup/start-orchestrator.proxy`.
 * Every scenario mirrors the real shape the matching flow/broker produces — see the method's own
 * comment for the file it was traced from.
 *
 * NAMED `StartOrchestratorProxy`, PascalCase, NOT the usual camelCase `xProxy` convention — two
 * independent rules agree this is the correct name for this one file: `enforce-project-structure`'s
 * `startup/` folder requires PascalCase for any value export (the `isProxy` override there resets
 * `exportSuffix`/`fileSuffix` but not `exportCase`), and `enforce-proxy-child-creation` derives the
 * expected child-proxy name from the REAL implementation's own import name — `StartOrchestrator`,
 * itself PascalCase because it is a namespace-style object, not a typical function. A camelCase name
 * fails both checks at once; this name satisfies both.
 *
 * KNOWN LINT GAPS (not fixable from this package — need an `eslint-plugin` change): (1)
 * `@dungeonmaster/enforce-implementation-colocation`'s forbidden-proxy-for-startup-files check still
 * fires on `start-orchestrator.ts`, because that rule assumes a startup file's only companion is an
 * `.integration.test.ts` and never a cross-package composing proxy; (2) a caller composing
 * `StartOrchestratorProxy()` trips `@dungeonmaster/enforce-proxy-child-creation`'s phantom-creation
 * check, because `parseImplementationImportsTransformer` only recognizes a 3-segment scoped import
 * (`@scope/pkg/subpath`) or a relative one — a bare 2-segment `@dungeonmaster/orchestrator` root
 * import (what every real caller uses to reach `StartOrchestrator`) is invisible to it. See this
 * item's DECISIONS for the exact rule fix each needs.
 *
 * USAGE:
 * const orchestrator = StartOrchestratorProxy();
 * orchestrator.getQuestReturns({ questId, result: GetQuestResultStub() });
 * orchestrator.getQuestNotFound({ questId });
 */

import { registerMock } from '@dungeonmaster/testing/register-mock';
import { DispatchStateStub } from '@dungeonmaster/shared/contracts';
import type {
  AdapterResultStub,
  DirectoryEntryStub,
  GuildId,
  GuildListItemStub,
  GuildName,
  GuildPath,
  GuildStub,
  OrchestrationModeStub,
  OrchestrationStatusStub,
  ProcessId,
  QuestId,
  QuestListItemStub,
  QuestProjectionStub,
  QuestQueueEntryStub,
  QuestStatus,
  QuestStub,
  QuestSummaryStub,
  QuestWorkItemId,
  RateLimitsSnapshotStub,
  SessionId,
  SkippedQuestFileStub,
  SmoketestSuite,
  UrlSlug,
} from '@dungeonmaster/shared/contracts';

import type { DispatchPlayResponseStub } from '../contracts/dispatch-play-response/dispatch-play-response.stub';
import { NextStepStub } from '../contracts/next-step/next-step.stub';
import { QuestGetServerConfigResultStub } from '../contracts/quest-get-server-config-result/quest-get-server-config-result.stub';
import { QuestWorkViewStub } from '../contracts/quest-work-view/quest-work-view.stub';
import { QuestNotFoundError } from '../errors/quest-not-found/quest-not-found-error';
// Self-referencing package import, deliberately NOT `'./start-orchestrator'`: every real caller
// (mcp, server) imports StartOrchestrator from `'@dungeonmaster/orchestrator'`, and jest.mock()
// keys on the resolved module path. A relative import here mocks a SEPARATE module instance from
// the one the real adapters call through, so this proxy's staging silently never reaches them —
// confirmed by reproducing the exact failure in packages/mcp/src/responders/quest/handle/
// quest-handle-responder.test.ts (see this item's DECISIONS).
import { StartOrchestrator } from '@dungeonmaster/orchestrator';

type AdapterResult = ReturnType<typeof AdapterResultStub>;
type DirectoryEntry = ReturnType<typeof DirectoryEntryStub>;
type DispatchState = ReturnType<typeof DispatchStateStub>;
type Guild = ReturnType<typeof GuildStub>;
type GuildListItem = ReturnType<typeof GuildListItemStub>;
type OrchestrationMode = ReturnType<typeof OrchestrationModeStub>;
type OrchestrationStatus = ReturnType<typeof OrchestrationStatusStub>;
type Quest = ReturnType<typeof QuestStub>;
type QuestListItem = ReturnType<typeof QuestListItemStub>;
type QuestProjection = ReturnType<typeof QuestProjectionStub>;
type QuestQueueEntry = ReturnType<typeof QuestQueueEntryStub>;
type QuestSummary = ReturnType<typeof QuestSummaryStub>;
type QuestWorkView = ReturnType<typeof QuestWorkViewStub>;
type RateLimitsSnapshot = ReturnType<typeof RateLimitsSnapshotStub>;
type SkippedQuestFile = ReturnType<typeof SkippedQuestFileStub>;
type NextStep = ReturnType<typeof NextStepStub>;
type QuestGetServerConfigResult = ReturnType<typeof QuestGetServerConfigResultStub>;
type DispatchPlayResponse = ReturnType<typeof DispatchPlayResponseStub>;

type AddQuestResult = Awaited<ReturnType<typeof StartOrchestrator.addQuest>>;
type GetQuestResult = Awaited<ReturnType<typeof StartOrchestrator.getQuest>>;
type GetPlanningNotesResult = Awaited<ReturnType<typeof StartOrchestrator.getPlanningNotes>>;
type GetQuestWorkResult = Awaited<ReturnType<typeof StartOrchestrator.getQuestWork>>;
type GetBlightChecklistResult = Awaited<ReturnType<typeof StartOrchestrator.getBlightChecklist>>;
type ModifyQuestResult = Awaited<ReturnType<typeof StartOrchestrator.modifyQuest>>;
type CreateWorktreeResult = Awaited<ReturnType<typeof StartOrchestrator.createWorktree>>;
type AgentPromptResult = Awaited<ReturnType<typeof StartOrchestrator.getAgentPrompt>>;
type QuestWorkResult = Awaited<ReturnType<typeof StartOrchestrator.questWork>>;
type RunSmoketestResult = Awaited<ReturnType<typeof StartOrchestrator.runSmoketest>>;
type GetSmoketestStateResult = ReturnType<typeof StartOrchestrator.getSmoketestState>;
type StartMonitorWatcherParams = Parameters<typeof StartOrchestrator.startMonitorWatcher>[0];

export const StartOrchestratorProxy = (): {
  // bootstrap — sync, void-ish AdapterResult. start-orchestrator.ts:83.
  bootstrapSucceeds: () => void;
  bootstrapThrows: (params: { error: Error }) => void;
  // Guild methods — GuildFlow, via guild-*-broker.
  listGuildsReturns: (params: { guilds: GuildListItem[] }) => void;
  listGuildsThrows: (params: { error: Error }) => void;
  getGuildReturns: (params: { guild: Guild }) => void;
  getGuildThrows: (params: { guildId: GuildId; error: Error }) => void;
  addGuildReturns: (params: { name: GuildName; path: GuildPath; guild: Guild }) => void;
  addGuildThrows: (params: { name: GuildName; path: GuildPath; error: Error }) => void;
  updateGuildReturns: (params: { guildId: GuildId; guild: Guild }) => void;
  updateGuildThrows: (params: { guildId: GuildId; error: Error }) => void;
  removeGuildThrows: (params: { guildId: GuildId; error: Error }) => void;
  browseDirectoriesReturns: (params: { path?: GuildPath; entries: DirectoryEntry[] }) => void;
  browseDirectoriesThrows: (params: { path?: GuildPath; error: Error }) => void;
  // Quest read methods — QuestFlow, via quest-*-broker.
  listQuestsReturns: (params: { guildId: GuildId; quests: QuestListItem[] }) => void;
  listQuestsThrows: (params: { guildId: GuildId; error: Error }) => void;
  listQuestsWithSkipsReturns: (params: {
    guildId: GuildId;
    quests: QuestListItem[];
    skipped: SkippedQuestFile[];
  }) => void;
  listQuestsWithSkipsThrows: (params: { guildId: GuildId; error: Error }) => void;
  loadQuestReturns: (params: { questId: QuestId; quest: Quest }) => void;
  loadQuestThrows: (params: { questId: QuestId; error: Error }) => void;
  // getQuest — QuestFlow.get -> questGetBroker.ts, whose catch block never throws: every failure
  // (missing quest, bad JSON) comes back as { success: false, error: <message> }.
  getQuestReturns: (params: { questId: QuestId; result: GetQuestResult }) => void;
  getQuestThrows: (params: { questId: QuestId; error: Error }) => void;
  // The real questGetBroker failure shape, traced through questFindQuestPathBroker's own
  // QuestNotFoundError (packages/orchestrator/src/errors/quest-not-found/quest-not-found-error.ts) —
  // never a hand-typed string.
  getQuestNotFound: (params: { questId: QuestId }) => void;
  getPlanningNotesReturns: (params: { questId: string; result: GetPlanningNotesResult }) => void;
  getPlanningNotesThrows: (params: { questId: string; error: Error }) => void;
  getQuestSummaryReturns: (params: { questId: string; summary: QuestSummary }) => void;
  getQuestSummaryThrows: (params: { questId: string; error: Error }) => void;
  getQuestProjectionReturns: (params: { questId: string; projection: QuestProjection }) => void;
  getQuestProjectionThrows: (params: { questId: string; error: Error }) => void;
  getQuestWorkReturns: (params: { questId: string; result: GetQuestWorkResult }) => void;
  getQuestWorkThrows: (params: { questId: string; error: Error }) => void;
  getQuestWorkDefaultView: () => QuestWorkView;
  getBlightChecklistReturns: (params: {
    questId: string;
    result: GetBlightChecklistResult;
  }) => void;
  getBlightChecklistThrows: (params: { questId: string; error: Error }) => void;
  getQuestStatusReturns: (params: { processId: ProcessId; status: OrchestrationStatus }) => void;
  getQuestStatusThrows: (params: { processId: ProcessId; error: Error }) => void;
  // Quest mutation methods — OrchestrationFlow / QuestFlow.
  startQuestReturns: (params: { questId: QuestId; processId: ProcessId }) => void;
  startQuestThrows: (params: { questId: QuestId; error: Error }) => void;
  pauseQuestReturns: (params: { questId: QuestId; paused: boolean }) => void;
  pauseQuestThrows: (params: { questId: QuestId; error: Error }) => void;
  resumeQuestReturns: (params: {
    questId: QuestId;
    resumed: boolean;
    restoredStatus: QuestStatus;
  }) => void;
  resumeQuestThrows: (params: { questId: QuestId; error: Error }) => void;
  mergeQuestReturns: (params: { questId: QuestId; merging: boolean }) => void;
  mergeQuestThrows: (params: { questId: QuestId; error: Error }) => void;
  mergeQuestGetCalls: () => readonly unknown[];
  abandonQuestReturns: (params: { questId: QuestId; abandoned: boolean }) => void;
  abandonQuestThrows: (params: { questId: QuestId; error: Error }) => void;
  deleteQuestReturns: (params: { questId: QuestId; deleted: boolean }) => void;
  deleteQuestThrows: (params: { questId: QuestId; error: Error }) => void;
  addQuestReturns: (params: { guildId: GuildId; result: AddQuestResult }) => void;
  addQuestThrows: (params: { guildId: GuildId; error: Error }) => void;
  modifyQuestReturns: (params: { questId?: string; result: ModifyQuestResult }) => void;
  modifyQuestThrows: (params: { questId?: string; error: Error }) => void;
  recordQuestSessionReturns: (params: { sessionId?: string }) => void;
  recordQuestSessionThrows: (params: { sessionId?: string; error: Error }) => void;
  createWorktreeReturns: (params: { name: string; result: CreateWorktreeResult }) => void;
  createWorktreeThrows: (params: { name: string; error: Error }) => void;
  // Chat methods — ChatStartFlow / ClarifyAnswerFlow / CommentBatchFlow / ChatReplayFlow.
  startChatReturns: (params: {
    guildId: GuildId;
    chatProcessId: ProcessId;
    questId?: QuestId;
  }) => void;
  startChatThrows: (params: { guildId: GuildId; error: Error }) => void;
  // Every call StartOrchestrator.startChat received, first-arg only — mirrors
  // playDispatchGetCalls. A caller composing this proxy that needs one field off a specific call
  // (by guildId, the most recent message, a minted questId) filters/reads this array itself rather
  // than reaching for the jest mock directly.
  startChatGetCalls: () => readonly unknown[];
  clarifyAnswerReturns: (params: { questId: QuestId; chatProcessId: ProcessId }) => void;
  clarifyAnswerThrows: (params: { questId: QuestId; error: Error }) => void;
  commentBatchReturns: (params: {
    questId: QuestId;
    chatProcessId: ProcessId;
    message: string;
  }) => void;
  commentBatchThrows: (params: { questId: QuestId; error: Error }) => void;
  stopAllChatsThrows: (params: { error: Error }) => void;
  stopAllChatsWasCalled: () => boolean;
  replayChatHistorySetupSuccess: () => void;
  replayChatHistorySetupFailure: (params: { error: Error }) => void;
  startFollowupChatReturns: (params: { questId: QuestId; chatProcessId: ProcessId }) => void;
  startFollowupChatThrows: (params: { questId: QuestId; error: Error }) => void;
  stopFollowupChatReturns: (params: { questId: QuestId; stopped: boolean }) => void;
  stopFollowupChatThrows: (params: { questId: QuestId; error: Error }) => void;
  // Agent prompt — AgentPromptFlow.
  getAgentPromptReturns: (params: {
    agent: string;
    questId: QuestId;
    result: AgentPromptResult;
  }) => void;
  getAgentPromptThrows: (params: { agent: string; questId: QuestId; error: Error }) => void;
  // Smoketest — SmoketestFlow.
  runSmoketestReturns: (params: { suite: SmoketestSuite; result: RunSmoketestResult }) => void;
  runSmoketestThrows: (params: { suite: SmoketestSuite; error: Error }) => void;
  getSmoketestStateReturns: (params: { result: GetSmoketestStateResult }) => void;
  getSmoketestStateThrows: (params: { error: Error }) => void;
  // Execution queue / dispatch — ExecutionQueueFlow / OrchestrationDispatchFlow.
  getExecutionQueueReturns: (params: { entries: readonly QuestQueueEntry[] }) => void;
  getExecutionQueueThrows: (params: { error: Error }) => void;
  getDispatchStateReturns: (params: { state: DispatchState }) => void;
  getDispatchStateThrows: (params: { error: Error }) => void;
  playDispatchReturns: (params: { response: DispatchPlayResponse }) => void;
  playDispatchThrows: (params: { error: Error }) => void;
  playDispatchGetCalls: () => readonly unknown[];
  pauseDispatchReturns: (params: { state: DispatchState }) => void;
  pauseDispatchThrows: (params: { error: Error }) => void;
  getOrchestrationModeReturns: (params: { mode: OrchestrationMode }) => void;
  getOrchestrationModeThrows: (params: { error: Error }) => void;
  normalizeDispatchBootReturns: (params: { state: DispatchState }) => void;
  normalizeDispatchBootThrows: (params: { error: Error }) => void;
  getRateLimitsReturns: (params: { snapshot: RateLimitsSnapshot | null }) => void;
  getRateLimitsThrows: (params: { error: Error }) => void;
  // MCP-driven surface — QuestFlow.mcpCreate / getNextStep / handleSignalBack / getServerConfig / work.
  createQuestForMcpReturns: (params: {
    userRequest: string;
    questId: QuestId;
    guildSlug: UrlSlug;
  }) => void;
  createQuestForMcpThrows: (params: { userRequest: string; error: Error }) => void;
  getNextStepReturns: (params: { step: NextStep }) => void;
  getNextStepThrows: (params: { error: Error }) => void;
  handleSignalBackResolves: (params: {
    questId?: QuestId;
    workItemId?: QuestWorkItemId;
    result: AdapterResult;
  }) => void;
  handleSignalBackThrows: (params: {
    questId?: QuestId;
    workItemId?: QuestWorkItemId;
    error: Error;
  }) => void;
  getServerConfigReturns: (params: { result: QuestGetServerConfigResult }) => void;
  getServerConfigThrows: (params: { error: Error }) => void;
  questWorkReturns: (params: {
    questId: string;
    workItemId: string;
    result: QuestWorkResult;
  }) => void;
  questWorkThrows: (params: { questId: string; workItemId: string; error: Error }) => void;
  // Reverse lookups — QuestFlow.findBySessionId / findByWorkItemId.
  findQuestBySessionIdReturns: (params: { sessionId: SessionId; questId: QuestId | null }) => void;
  findQuestBySessionIdThrows: (params: { sessionId: SessionId; error: Error }) => void;
  findQuestByWorkItemIdReturns: (params: {
    workItemId: QuestWorkItemId;
    questId: QuestId | null;
  }) => void;
  findQuestByWorkItemIdThrows: (params: { workItemId: QuestWorkItemId; error: Error }) => void;
  // Monitor watcher — QuestFlow.startMonitorWatcher.
  startMonitorWatcherResolves: (params: { parentSessionId: string }) => void;
  startMonitorWatcherThrows: (params: { parentSessionId: string; error: Error }) => void;
  startMonitorWatcherWasStopCalled: () => boolean;
  startMonitorWatcherStartedWithWorkerWorkItemId: (params: {
    parentSessionId: string;
    workerWorkItemId: string;
  }) => boolean;
  startMonitorWatcherStartedWithoutWorkerWorkItemId: (params: {
    parentSessionId: string;
  }) => boolean;
  startMonitorWatcherStartedWithWorkerQuestId: (params: {
    parentSessionId: string;
    workerQuestId: string;
  }) => boolean;
  startMonitorWatcherStartedWithProjectDir: (params: {
    parentSessionId: string;
    projectDir: string;
  }) => boolean;
} => {
  const bootstrapHandle = registerMock({ fn: StartOrchestrator.bootstrap });
  const listGuildsHandle = registerMock({ fn: StartOrchestrator.listGuilds });
  const getGuildHandle = registerMock({ fn: StartOrchestrator.getGuild });
  const addGuildHandle = registerMock({ fn: StartOrchestrator.addGuild });
  const updateGuildHandle = registerMock({ fn: StartOrchestrator.updateGuild });
  const removeGuildHandle = registerMock({ fn: StartOrchestrator.removeGuild });
  const browseDirectoriesHandle = registerMock({ fn: StartOrchestrator.browseDirectories });
  const listQuestsHandle = registerMock({ fn: StartOrchestrator.listQuests });
  const listQuestsWithSkipsHandle = registerMock({ fn: StartOrchestrator.listQuestsWithSkips });
  const loadQuestHandle = registerMock({ fn: StartOrchestrator.loadQuest });
  const getQuestHandle = registerMock({ fn: StartOrchestrator.getQuest });
  const getPlanningNotesHandle = registerMock({ fn: StartOrchestrator.getPlanningNotes });
  const getQuestSummaryHandle = registerMock({ fn: StartOrchestrator.getQuestSummary });
  const getQuestProjectionHandle = registerMock({ fn: StartOrchestrator.getQuestProjection });
  const getQuestWorkHandle = registerMock({ fn: StartOrchestrator.getQuestWork });
  const getBlightChecklistHandle = registerMock({ fn: StartOrchestrator.getBlightChecklist });
  const getQuestStatusHandle = registerMock({ fn: StartOrchestrator.getQuestStatus });
  const startQuestHandle = registerMock({ fn: StartOrchestrator.startQuest });
  const pauseQuestHandle = registerMock({ fn: StartOrchestrator.pauseQuest });
  const resumeQuestHandle = registerMock({ fn: StartOrchestrator.resumeQuest });
  const mergeQuestHandle = registerMock({ fn: StartOrchestrator.mergeQuest });
  const abandonQuestHandle = registerMock({ fn: StartOrchestrator.abandonQuest });
  const deleteQuestHandle = registerMock({ fn: StartOrchestrator.deleteQuest });
  const addQuestHandle = registerMock({ fn: StartOrchestrator.addQuest });
  const modifyQuestHandle = registerMock({ fn: StartOrchestrator.modifyQuest });
  const recordQuestSessionHandle = registerMock({ fn: StartOrchestrator.recordQuestSession });
  const createWorktreeHandle = registerMock({ fn: StartOrchestrator.createWorktree });
  const startChatHandle = registerMock({ fn: StartOrchestrator.startChat });
  const clarifyAnswerHandle = registerMock({ fn: StartOrchestrator.clarifyAnswer });
  const commentBatchHandle = registerMock({ fn: StartOrchestrator.commentBatch });
  const stopAllChatsHandle = registerMock({ fn: StartOrchestrator.stopAllChats });
  const replayChatHistoryHandle = registerMock({ fn: StartOrchestrator.replayChatHistory });
  const startFollowupChatHandle = registerMock({ fn: StartOrchestrator.startFollowupChat });
  const stopFollowupChatHandle = registerMock({ fn: StartOrchestrator.stopFollowupChat });
  const getAgentPromptHandle = registerMock({ fn: StartOrchestrator.getAgentPrompt });
  const runSmoketestHandle = registerMock({ fn: StartOrchestrator.runSmoketest });
  const getSmoketestStateHandle = registerMock({ fn: StartOrchestrator.getSmoketestState });
  const getExecutionQueueHandle = registerMock({ fn: StartOrchestrator.getExecutionQueue });
  const getDispatchStateHandle = registerMock({ fn: StartOrchestrator.getDispatchState });
  const playDispatchHandle = registerMock({ fn: StartOrchestrator.playDispatch });
  const pauseDispatchHandle = registerMock({ fn: StartOrchestrator.pauseDispatch });
  const getOrchestrationModeHandle = registerMock({ fn: StartOrchestrator.getOrchestrationMode });
  const normalizeDispatchBootHandle = registerMock({ fn: StartOrchestrator.normalizeDispatchBoot });
  const getRateLimitsHandle = registerMock({ fn: StartOrchestrator.getRateLimits });
  const createQuestForMcpHandle = registerMock({ fn: StartOrchestrator.createQuestForMcp });
  const getNextStepHandle = registerMock({ fn: StartOrchestrator.getNextStep });
  const handleSignalBackHandle = registerMock({ fn: StartOrchestrator.handleSignalBack });
  const getServerConfigHandle = registerMock({ fn: StartOrchestrator.getServerConfig });
  const questWorkHandle = registerMock({ fn: StartOrchestrator.questWork });
  const findQuestBySessionIdHandle = registerMock({ fn: StartOrchestrator.findQuestBySessionId });
  const findQuestByWorkItemIdHandle = registerMock({ fn: StartOrchestrator.findQuestByWorkItemId });
  const startMonitorWatcherHandle = registerMock({ fn: StartOrchestrator.startMonitorWatcher });

  // The three real zero-argument defaults every mcp/server caller already relied on — a test that
  // never sets up its own scenario for one of these still gets the same answer the old per-caller
  // proxies gave it.
  getNextStepHandle.calledWith([]).resolves(NextStepStub());
  getServerConfigHandle.calledWith([]).returns(QuestGetServerConfigResultStub());
  listGuildsHandle.calledWith([]).resolves([]);
  getRateLimitsHandle.calledWith([]).resolves(null);
  getDispatchStateHandle.calledWith([]).resolves(DispatchStateStub());
  normalizeDispatchBootHandle.calledWith([]).resolves(DispatchStateStub());
  removeGuildHandle.calledWith([]).resolves(undefined);
  stopAllChatsHandle.calledWith([]).returns(undefined);
  findQuestByWorkItemIdHandle.calledWith([]).resolves(null);

  const monitorWatcherStopState = { called: false };

  return {
    bootstrapSucceeds: (): void => {
      bootstrapHandle.calledWith([]).returns({ success: true });
    },
    bootstrapThrows: ({ error }: { error: Error }): void => {
      bootstrapHandle.calledWith([]).throws(error);
    },
    listGuildsReturns: ({ guilds }: { guilds: GuildListItem[] }): void => {
      listGuildsHandle.calledWith([]).resolves(guilds);
    },
    listGuildsThrows: ({ error }: { error: Error }): void => {
      listGuildsHandle.calledWith([]).rejects(error);
    },
    // The guild's own id is the address — deriving it from guild.id keeps every caller honest.
    getGuildReturns: ({ guild }: { guild: Guild }): void => {
      getGuildHandle.calledWith([{ guildId: guild.id }]).resolves(guild);
    },
    getGuildThrows: ({ guildId, error }: { guildId: GuildId; error: Error }): void => {
      getGuildHandle.calledWith([{ guildId }]).rejects(error);
    },
    addGuildReturns: ({
      name,
      path,
      guild,
    }: {
      name: GuildName;
      path: GuildPath;
      guild: Guild;
    }): void => {
      addGuildHandle.calledWith([{ name, path }]).resolves(guild);
    },
    addGuildThrows: ({
      name,
      path,
      error,
    }: {
      name: GuildName;
      path: GuildPath;
      error: Error;
    }): void => {
      addGuildHandle.calledWith([{ name, path }]).rejects(error);
    },
    updateGuildReturns: ({ guildId, guild }: { guildId: GuildId; guild: Guild }): void => {
      updateGuildHandle.calledWith([{ guildId }]).resolves(guild);
    },
    updateGuildThrows: ({ guildId, error }: { guildId: GuildId; error: Error }): void => {
      updateGuildHandle.calledWith([{ guildId }]).rejects(error);
    },
    // removeGuild discards its resolved value — only the throw path is observable.
    removeGuildThrows: ({ guildId, error }: { guildId: GuildId; error: Error }): void => {
      removeGuildHandle.calledWith([{ guildId }]).rejects(error);
    },
    browseDirectoriesReturns: ({
      path,
      entries,
    }: {
      path?: GuildPath;
      entries: DirectoryEntry[];
    }): void => {
      browseDirectoriesHandle.calledWith(path === undefined ? [{}] : [{ path }]).returns(entries);
    },
    browseDirectoriesThrows: ({ path, error }: { path?: GuildPath; error: Error }): void => {
      browseDirectoriesHandle.calledWith(path === undefined ? [{}] : [{ path }]).throws(error);
    },
    listQuestsReturns: ({
      guildId,
      quests,
    }: {
      guildId: GuildId;
      quests: QuestListItem[];
    }): void => {
      listQuestsHandle.calledWith([{ guildId }]).resolves(quests);
    },
    listQuestsThrows: ({ guildId, error }: { guildId: GuildId; error: Error }): void => {
      listQuestsHandle.calledWith([{ guildId }]).rejects(error);
    },
    listQuestsWithSkipsReturns: ({
      guildId,
      quests,
      skipped,
    }: {
      guildId: GuildId;
      quests: QuestListItem[];
      skipped: SkippedQuestFile[];
    }): void => {
      listQuestsWithSkipsHandle.calledWith([{ guildId }]).resolves({ quests, skipped });
    },
    listQuestsWithSkipsThrows: ({ guildId, error }: { guildId: GuildId; error: Error }): void => {
      listQuestsWithSkipsHandle.calledWith([{ guildId }]).rejects(error);
    },
    loadQuestReturns: ({ questId, quest }: { questId: QuestId; quest: Quest }): void => {
      loadQuestHandle.calledWith([{ questId }]).resolves(quest);
    },
    loadQuestThrows: ({ questId, error }: { questId: QuestId; error: Error }): void => {
      loadQuestHandle.calledWith([{ questId }]).rejects(error);
    },
    getQuestReturns: ({ questId, result }: { questId: QuestId; result: GetQuestResult }): void => {
      getQuestHandle.calledWith([{ questId }]).resolves(result);
    },
    getQuestThrows: ({ questId, error }: { questId: QuestId; error: Error }): void => {
      getQuestHandle.calledWith([{ questId }]).rejects(error);
    },
    getQuestNotFound: ({ questId }: { questId: QuestId }): void => {
      const notFound = new QuestNotFoundError({ questId });
      getQuestHandle
        .calledWith([{ questId }])
        .resolves({ success: false, error: notFound.message });
    },
    getPlanningNotesReturns: ({
      questId,
      result,
    }: {
      questId: string;
      result: GetPlanningNotesResult;
    }): void => {
      getPlanningNotesHandle.calledWith([{ questId }]).resolves(result);
    },
    getPlanningNotesThrows: ({ questId, error }: { questId: string; error: Error }): void => {
      getPlanningNotesHandle.calledWith([{ questId }]).rejects(error);
    },
    getQuestSummaryReturns: ({
      questId,
      summary,
    }: {
      questId: string;
      summary: QuestSummary;
    }): void => {
      getQuestSummaryHandle.calledWith([{ questId }]).resolves(summary);
    },
    getQuestSummaryThrows: ({ questId, error }: { questId: string; error: Error }): void => {
      getQuestSummaryHandle.calledWith([{ questId }]).rejects(error);
    },
    getQuestProjectionReturns: ({
      questId,
      projection,
    }: {
      questId: string;
      projection: QuestProjection;
    }): void => {
      getQuestProjectionHandle.calledWith([{ questId }]).resolves(projection);
    },
    getQuestProjectionThrows: ({ questId, error }: { questId: string; error: Error }): void => {
      getQuestProjectionHandle.calledWith([{ questId }]).rejects(error);
    },
    // questId alone addresses both mcp's and server's call shapes — describing a second field
    // here would leave the other caller's own shape unstaged.
    getQuestWorkReturns: ({
      questId,
      result,
    }: {
      questId: string;
      result: GetQuestWorkResult;
    }): void => {
      getQuestWorkHandle.calledWith([{ questId }]).resolves(result);
    },
    getQuestWorkThrows: ({ questId, error }: { questId: string; error: Error }): void => {
      getQuestWorkHandle.calledWith([{ questId }]).rejects(error);
    },
    getQuestWorkDefaultView: (): QuestWorkView => QuestWorkViewStub(),
    getBlightChecklistReturns: ({
      questId,
      result,
    }: {
      questId: string;
      result: GetBlightChecklistResult;
    }): void => {
      getBlightChecklistHandle.calledWith([{ questId }]).resolves(result);
    },
    getBlightChecklistThrows: ({ questId, error }: { questId: string; error: Error }): void => {
      getBlightChecklistHandle.calledWith([{ questId }]).rejects(error);
    },
    getQuestStatusReturns: ({
      processId,
      status,
    }: {
      processId: ProcessId;
      status: OrchestrationStatus;
    }): void => {
      getQuestStatusHandle.calledWith([{ processId }]).returns(status);
    },
    getQuestStatusThrows: ({ processId, error }: { processId: ProcessId; error: Error }): void => {
      getQuestStatusHandle.calledWith([{ processId }]).throws(error);
    },
    startQuestReturns: ({
      questId,
      processId,
    }: {
      questId: QuestId;
      processId: ProcessId;
    }): void => {
      startQuestHandle.calledWith([{ questId }]).resolves(processId);
    },
    startQuestThrows: ({ questId, error }: { questId: QuestId; error: Error }): void => {
      startQuestHandle.calledWith([{ questId }]).rejects(error);
    },
    pauseQuestReturns: ({ questId, paused }: { questId: QuestId; paused: boolean }): void => {
      pauseQuestHandle.calledWith([{ questId }]).resolves({ paused });
    },
    pauseQuestThrows: ({ questId, error }: { questId: QuestId; error: Error }): void => {
      pauseQuestHandle.calledWith([{ questId }]).rejects(error);
    },
    resumeQuestReturns: ({
      questId,
      resumed,
      restoredStatus,
    }: {
      questId: QuestId;
      resumed: boolean;
      restoredStatus: QuestStatus;
    }): void => {
      resumeQuestHandle.calledWith([{ questId }]).resolves({ resumed, restoredStatus });
    },
    resumeQuestThrows: ({ questId, error }: { questId: QuestId; error: Error }): void => {
      resumeQuestHandle.calledWith([{ questId }]).rejects(error);
    },
    mergeQuestReturns: ({ questId, merging }: { questId: QuestId; merging: boolean }): void => {
      mergeQuestHandle.calledWith([{ questId }]).resolves({ merging });
    },
    mergeQuestThrows: ({ questId, error }: { questId: QuestId; error: Error }): void => {
      mergeQuestHandle.calledWith([{ questId }]).rejects(error);
    },
    // Unaddressed on purpose: a status-gate test needs to prove the call was reached ZERO times.
    mergeQuestGetCalls: (): readonly unknown[] =>
      mergeQuestHandle.callsMatching([]).map(([firstArg]: readonly unknown[]) => firstArg),
    abandonQuestReturns: ({
      questId,
      abandoned,
    }: {
      questId: QuestId;
      abandoned: boolean;
    }): void => {
      abandonQuestHandle.calledWith([{ questId }]).resolves({ abandoned });
    },
    abandonQuestThrows: ({ questId, error }: { questId: QuestId; error: Error }): void => {
      abandonQuestHandle.calledWith([{ questId }]).rejects(error);
    },
    deleteQuestReturns: ({ questId, deleted }: { questId: QuestId; deleted: boolean }): void => {
      deleteQuestHandle.calledWith([{ questId }]).resolves({ deleted });
    },
    deleteQuestThrows: ({ questId, error }: { questId: QuestId; error: Error }): void => {
      deleteQuestHandle.calledWith([{ questId }]).rejects(error);
    },
    addQuestReturns: ({ guildId, result }: { guildId: GuildId; result: AddQuestResult }): void => {
      addQuestHandle.calledWith([{ guildId }]).resolves(result);
    },
    addQuestThrows: ({ guildId, error }: { guildId: GuildId; error: Error }): void => {
      addQuestHandle.calledWith([{ guildId }]).rejects(error);
    },
    // questId is optional: a caller that discards the result and has no questId at proxy-build
    // time can omit it, which falls back to calledWith([]) — a real wildcard staged explicitly.
    modifyQuestReturns: ({
      questId,
      result,
    }: {
      questId?: string;
      result: ModifyQuestResult;
    }): void => {
      modifyQuestHandle.calledWith(questId === undefined ? [] : [{ questId }]).resolves(result);
    },
    modifyQuestThrows: ({ questId, error }: { questId?: string; error: Error }): void => {
      modifyQuestHandle.calledWith(questId === undefined ? [] : [{ questId }]).rejects(error);
    },
    recordQuestSessionReturns: ({ sessionId }: { sessionId?: string }): void => {
      recordQuestSessionHandle
        .calledWith(sessionId === undefined ? [] : [{ sessionId }])
        .resolves({ success: true as const });
    },
    recordQuestSessionThrows: ({
      sessionId,
      error,
    }: {
      sessionId?: string;
      error: Error;
    }): void => {
      recordQuestSessionHandle
        .calledWith(sessionId === undefined ? [] : [{ sessionId }])
        .rejects(error);
    },
    // The name IS the address: one session can ask for several worktrees.
    createWorktreeReturns: ({
      name,
      result,
    }: {
      name: string;
      result: CreateWorktreeResult;
    }): void => {
      createWorktreeHandle.calledWith([{ name }]).resolves(result);
    },
    createWorktreeThrows: ({ name, error }: { name: string; error: Error }): void => {
      createWorktreeHandle.calledWith([{ name }]).rejects(error);
    },
    startChatReturns: ({
      guildId,
      chatProcessId,
      questId,
    }: {
      guildId: GuildId;
      chatProcessId: ProcessId;
      questId?: QuestId;
    }): void => {
      startChatHandle
        .calledWith([{ guildId }])
        .resolves({ chatProcessId, ...(questId === undefined ? {} : { questId }) });
    },
    startChatThrows: ({ guildId, error }: { guildId: GuildId; error: Error }): void => {
      startChatHandle.calledWith([{ guildId }]).rejects(error);
    },
    // Unaddressed on purpose, mirroring playDispatchGetCalls: a caller needing one field off a
    // specific call (guildId, the last message, a minted questId) filters/reads this itself.
    startChatGetCalls: (): readonly unknown[] =>
      startChatHandle.callsMatching([]).map((call) => call[0]),
    clarifyAnswerReturns: ({
      questId,
      chatProcessId,
    }: {
      questId: QuestId;
      chatProcessId: ProcessId;
    }): void => {
      clarifyAnswerHandle.calledWith([{ questId }]).resolves({ chatProcessId });
    },
    clarifyAnswerThrows: ({ questId, error }: { questId: QuestId; error: Error }): void => {
      clarifyAnswerHandle.calledWith([{ questId }]).rejects(error);
    },
    commentBatchReturns: ({
      questId,
      chatProcessId,
      message,
    }: {
      questId: QuestId;
      chatProcessId: ProcessId;
      message: string;
    }): void => {
      commentBatchHandle.calledWith([{ questId }]).resolves({ chatProcessId, message });
    },
    commentBatchThrows: ({ questId, error }: { questId: QuestId; error: Error }): void => {
      commentBatchHandle.calledWith([{ questId }]).rejects(error);
    },
    // stopAllChats takes no arguments — calledWith([]) is the honest description of that call.
    stopAllChatsThrows: ({ error }: { error: Error }): void => {
      stopAllChatsHandle.calledWith([]).throws(error);
    },
    stopAllChatsWasCalled: (): boolean => stopAllChatsHandle.callsMatching([]).length > 0,
    // No address: the adapter discards whatever replayChatHistory resolves to (it always returns
    // { success: true } itself), and callers set up a blanket success/failure without knowing
    // which session the flow under test resolves to.
    replayChatHistorySetupSuccess: (): void => {
      replayChatHistoryHandle.calledWith([]).resolves(undefined);
    },
    replayChatHistorySetupFailure: ({ error }: { error: Error }): void => {
      replayChatHistoryHandle.calledWith([]).rejects(error);
    },
    startFollowupChatReturns: ({
      questId,
      chatProcessId,
    }: {
      questId: QuestId;
      chatProcessId: ProcessId;
    }): void => {
      startFollowupChatHandle.calledWith([{ questId }]).resolves({ chatProcessId });
    },
    startFollowupChatThrows: ({ questId, error }: { questId: QuestId; error: Error }): void => {
      startFollowupChatHandle.calledWith([{ questId }]).rejects(error);
    },
    stopFollowupChatReturns: ({
      questId,
      stopped,
    }: {
      questId: QuestId;
      stopped: boolean;
    }): void => {
      stopFollowupChatHandle.calledWith([{ questId }]).resolves({ stopped });
    },
    stopFollowupChatThrows: ({ questId, error }: { questId: QuestId; error: Error }): void => {
      stopFollowupChatHandle.calledWith([{ questId }]).rejects(error);
    },
    getAgentPromptReturns: ({
      agent,
      questId,
      result,
    }: {
      agent: string;
      questId: QuestId;
      result: AgentPromptResult;
    }): void => {
      getAgentPromptHandle.calledWith([{ agent, questId }]).resolves(result);
    },
    getAgentPromptThrows: ({
      agent,
      questId,
      error,
    }: {
      agent: string;
      questId: QuestId;
      error: Error;
    }): void => {
      getAgentPromptHandle.calledWith([{ agent, questId }]).rejects(error);
    },
    runSmoketestReturns: ({
      suite,
      result,
    }: {
      suite: SmoketestSuite;
      result: RunSmoketestResult;
    }): void => {
      runSmoketestHandle.calledWith([{ suite }]).resolves(result);
    },
    runSmoketestThrows: ({ suite, error }: { suite: SmoketestSuite; error: Error }): void => {
      runSmoketestHandle.calledWith([{ suite }]).rejects(error);
    },
    getSmoketestStateReturns: ({ result }: { result: GetSmoketestStateResult }): void => {
      getSmoketestStateHandle.calledWith([]).returns(result);
    },
    getSmoketestStateThrows: ({ error }: { error: Error }): void => {
      getSmoketestStateHandle.calledWith([]).throws(error);
    },
    getExecutionQueueReturns: ({ entries }: { entries: readonly QuestQueueEntry[] }): void => {
      getExecutionQueueHandle.calledWith([]).resolves(entries);
    },
    getExecutionQueueThrows: ({ error }: { error: Error }): void => {
      getExecutionQueueHandle.calledWith([]).rejects(error);
    },
    getDispatchStateReturns: ({ state }: { state: DispatchState }): void => {
      getDispatchStateHandle.calledWith([]).resolves(state);
    },
    getDispatchStateThrows: ({ error }: { error: Error }): void => {
      getDispatchStateHandle.calledWith([]).rejects(error);
    },
    // playDispatch takes an optional { force }, but no caller varies the response by it —
    // getCalls() is what verifies which force value a given call actually forwarded.
    playDispatchReturns: ({ response }: { response: DispatchPlayResponse }): void => {
      playDispatchHandle.calledWith([]).resolves(response);
    },
    playDispatchThrows: ({ error }: { error: Error }): void => {
      playDispatchHandle.calledWith([]).rejects(error);
    },
    playDispatchGetCalls: (): readonly unknown[] =>
      playDispatchHandle.callsMatching([]).map((call) => call[0]),
    pauseDispatchReturns: ({ state }: { state: DispatchState }): void => {
      pauseDispatchHandle.calledWith([]).resolves(state);
    },
    pauseDispatchThrows: ({ error }: { error: Error }): void => {
      pauseDispatchHandle.calledWith([]).rejects(error);
    },
    getOrchestrationModeReturns: ({ mode }: { mode: OrchestrationMode }): void => {
      getOrchestrationModeHandle.calledWith([]).resolves(mode);
    },
    getOrchestrationModeThrows: ({ error }: { error: Error }): void => {
      getOrchestrationModeHandle.calledWith([]).rejects(error);
    },
    normalizeDispatchBootReturns: ({ state }: { state: DispatchState }): void => {
      normalizeDispatchBootHandle.calledWith([]).resolves(state);
    },
    normalizeDispatchBootThrows: ({ error }: { error: Error }): void => {
      normalizeDispatchBootHandle.calledWith([]).rejects(error);
    },
    getRateLimitsReturns: ({ snapshot }: { snapshot: RateLimitsSnapshot | null }): void => {
      getRateLimitsHandle.calledWith([]).resolves(snapshot);
    },
    getRateLimitsThrows: ({ error }: { error: Error }): void => {
      getRateLimitsHandle.calledWith([]).rejects(error);
    },
    createQuestForMcpReturns: ({
      userRequest,
      questId,
      guildSlug,
    }: {
      userRequest: string;
      questId: QuestId;
      guildSlug: UrlSlug;
    }): void => {
      createQuestForMcpHandle.calledWith([{ userRequest }]).resolves({ questId, guildSlug });
    },
    createQuestForMcpThrows: ({
      userRequest,
      error,
    }: {
      userRequest: string;
      error: Error;
    }): void => {
      createQuestForMcpHandle.calledWith([{ userRequest }]).rejects(error);
    },
    // getNextStep takes no arguments — [] is the only possible, exhaustive address.
    getNextStepReturns: ({ step }: { step: NextStep }): void => {
      getNextStepHandle.calledWith([]).resolves(step);
    },
    getNextStepThrows: ({ error }: { error: Error }): void => {
      getNextStepHandle.calledWith([]).rejects(error);
    },
    // questId/workItemId optional: a fire-and-forget caller that never reads the result and does
    // not know the address ahead of time can stage a real wildcard via calledWith([]).
    handleSignalBackResolves: ({
      questId,
      workItemId,
      result,
    }: {
      questId?: QuestId;
      workItemId?: QuestWorkItemId;
      result: AdapterResult;
    }): void => {
      const address =
        questId === undefined || workItemId === undefined ? [] : [{ questId, workItemId }];
      handleSignalBackHandle.calledWith(address).resolves(result);
    },
    handleSignalBackThrows: ({
      questId,
      workItemId,
      error,
    }: {
      questId?: QuestId;
      workItemId?: QuestWorkItemId;
      error: Error;
    }): void => {
      const address =
        questId === undefined || workItemId === undefined ? [] : [{ questId, workItemId }];
      handleSignalBackHandle.calledWith(address).rejects(error);
    },
    getServerConfigReturns: ({ result }: { result: QuestGetServerConfigResult }): void => {
      getServerConfigHandle.calledWith([]).returns(result);
    },
    getServerConfigThrows: ({ error }: { error: Error }): void => {
      getServerConfigHandle.calledWith([]).implement(() => {
        throw error;
      });
    },
    // questId + workItemId together discriminate: several dispatched sessions may call quest-work
    // against the same quest at once, each with its own work item.
    questWorkReturns: ({
      questId,
      workItemId,
      result,
    }: {
      questId: string;
      workItemId: string;
      result: QuestWorkResult;
    }): void => {
      questWorkHandle.calledWith([{ questId, workItemId }]).resolves(result);
    },
    questWorkThrows: ({
      questId,
      workItemId,
      error,
    }: {
      questId: string;
      workItemId: string;
      error: Error;
    }): void => {
      questWorkHandle.calledWith([{ questId, workItemId }]).rejects(error);
    },
    findQuestBySessionIdReturns: ({
      sessionId,
      questId,
    }: {
      sessionId: SessionId;
      questId: QuestId | null;
    }): void => {
      findQuestBySessionIdHandle.calledWith([{ sessionId }]).resolves(questId);
    },
    findQuestBySessionIdThrows: ({
      sessionId,
      error,
    }: {
      sessionId: SessionId;
      error: Error;
    }): void => {
      findQuestBySessionIdHandle.calledWith([{ sessionId }]).rejects(error);
    },
    findQuestByWorkItemIdReturns: ({
      workItemId,
      questId,
    }: {
      workItemId: QuestWorkItemId;
      questId: QuestId | null;
    }): void => {
      findQuestByWorkItemIdHandle.calledWith([{ workItemId }]).resolves(questId);
    },
    findQuestByWorkItemIdThrows: ({
      workItemId,
      error,
    }: {
      workItemId: QuestWorkItemId;
      error: Error;
    }): void => {
      findQuestByWorkItemIdHandle.calledWith([{ workItemId }]).rejects(error);
    },
    startMonitorWatcherResolves: ({ parentSessionId }: { parentSessionId: string }): void => {
      startMonitorWatcherHandle.calledWith([{ parentSessionId }]).implement(async () =>
        Promise.resolve({
          stop: (): void => {
            monitorWatcherStopState.called = true;
          },
        }),
      );
    },
    startMonitorWatcherThrows: ({
      parentSessionId,
      error,
    }: {
      parentSessionId: string;
      error: Error;
    }): void => {
      startMonitorWatcherHandle.calledWith([{ parentSessionId }]).rejects(error);
    },
    startMonitorWatcherWasStopCalled: (): boolean => monitorWatcherStopState.called,
    // A node-dispatch worker session must be started WITH its owning workItemId so the watcher
    // tails it under the unfiltered proc-worker- prefix; a /dumpster-launch dispatcher session
    // must be started WITHOUT it.
    startMonitorWatcherStartedWithWorkerWorkItemId: ({
      parentSessionId,
      workerWorkItemId,
    }: {
      parentSessionId: string;
      workerWorkItemId: string;
    }): boolean =>
      startMonitorWatcherHandle.callsMatching([{ parentSessionId, workerWorkItemId }]).length > 0,
    startMonitorWatcherStartedWithoutWorkerWorkItemId: ({
      parentSessionId,
    }: {
      parentSessionId: string;
    }): boolean =>
      startMonitorWatcherHandle
        .callsMatching([{ parentSessionId }])
        .some((call) => (call[0] as StartMonitorWatcherParams).workerWorkItemId === undefined),
    startMonitorWatcherStartedWithWorkerQuestId: ({
      parentSessionId,
      workerQuestId,
    }: {
      parentSessionId: string;
      workerQuestId: string;
    }): boolean =>
      startMonitorWatcherHandle.callsMatching([{ parentSessionId, workerQuestId }]).length > 0,
    startMonitorWatcherStartedWithProjectDir: ({
      parentSessionId,
      projectDir,
    }: {
      parentSessionId: string;
      projectDir: string;
    }): boolean =>
      startMonitorWatcherHandle.callsMatching([{ parentSessionId, projectDir }]).length > 0,
  };
};
