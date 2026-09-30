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

import type { WorkItem, GuildId, GuildName, GuildPath, ProcessId, QuestStatus, QuestWorkItemId, SessionId, SmoketestSuite, UrlSlug } from '@dungeonmaster/shared/contracts';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { RecordedCalls } from '@dungeonmaster/testing/register-mock';
import { DispatchStateStub } from '@dungeonmaster/shared/contracts/dispatch-state/dispatch-state.stub';
import type { DirectoryEntryStub } from '@dungeonmaster/shared/contracts/directory-entry/directory-entry.stub';
import type { GuildListItemStub } from '@dungeonmaster/shared/contracts/guild-list-item/guild-list-item.stub';
import type { GuildStub } from '@dungeonmaster/shared/contracts/guild/guild.stub';
import type { OrchestrationModeStub } from '@dungeonmaster/shared/contracts/orchestration-mode/orchestration-mode.stub';
import type { OrchestrationStatusStub } from '@dungeonmaster/shared/contracts/orchestration-status/orchestration-status.stub';
import type { QuestListItemStub } from '@dungeonmaster/shared/contracts/quest-list-item/quest-list-item.stub';
import type { QuestProjectionStub } from '@dungeonmaster/shared/contracts/quest-projection/quest-projection.stub';
import type { QuestQueueEntryStub } from '@dungeonmaster/shared/contracts/quest-queue-entry/quest-queue-entry.stub';
import type { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';
import type { QuestSummaryStub } from '@dungeonmaster/shared/contracts/quest-summary/quest-summary.stub';
import type { RateLimitsSnapshotStub } from '@dungeonmaster/shared/contracts/rate-limits-snapshot/rate-limits-snapshot.stub';
import type { SkippedQuestFileStub } from '@dungeonmaster/shared/contracts/skipped-quest-file/skipped-quest-file.stub';

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
import { setTimeout } from '#gateway/node/setTimeout';

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
type QuestGetServerConfigResult = ReturnType<typeof QuestGetServerConfigResultStub>;

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

export const StartOrchestratorProxy = (): {
  // bootstrap — sync, returns void. start-orchestrator.ts:80.
  bootstrapSucceeds: () => void;
  bootstrapThrows: (params: { error: Error }) => void;
  // Every call StartOrchestrator.bootstrap received, as the raw argument lists — bootstrap takes
  // none, so `[[]]` is exactly one call.
  bootstrapGetCalls: () => RecordedCalls;
  // Guild methods — GuildFlow, via guild-*-broker.
  listGuildsReturns: (params: { guilds: GuildListItem[] }) => void;
  listGuildsThrows: (params: { error: Error }) => void;
  getGuildReturns: (params: { guild: Guild }) => void;
  getGuildThrows: (params: { guildId: GuildId; error: Error }) => void;
  addGuildReturns: (params: { name: GuildName; path: GuildPath; guild: Guild }) => void;
  addGuildThrows: (params: { name: GuildName; path: GuildPath; error: Error }) => void;
  updateGuildReturns: (params: { guildId: GuildId; guild: Guild }) => void;
  updateGuildThrows: (params: { guildId: GuildId; error: Error }) => void;
  removeGuildResolves: (params: { guildId: GuildId }) => void;
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
  loadQuestReturns: (params: { questId: Quest['id']; quest: Quest }) => void;
  loadQuestThrows: (params: { questId: Quest['id']; error: Error }) => void;
  // ONE-SHOT staging, consumed in REGISTRATION order — lets a test hand two SUCCESSIVE calls for
  // the SAME questId two DIFFERENT quest snapshots, which the sticky `loadQuestReturns` cannot do
  // (a later `loadQuestReturns` for the same questId overwrites every prior call). Traced from
  // server-init-responder's outbox-race test: two onQuestChanged firings for one questId, resolved
  // out of firing order.
  loadQuestReturnsOnce: (params: { questId: Quest['id']; quest: Quest }) => void;
  // Same one-shot ordering as `loadQuestReturnsOnce`, but resolves after `delayMs` instead of
  // immediately — for reproducing two overlapping loads that finish OUT OF the order they started.
  loadQuestReturnsOnceDelayed: (params: {
    questId: Quest['id'];
    quest: Quest;
    delayMs: number;
  }) => void;
  // getQuest — QuestFlow.get -> questGetBroker.ts, whose catch block never throws: every failure
  // (missing quest, bad JSON) comes back as { success: false, error: <message> }.
  getQuestReturns: (params: { questId: Quest['id']; result: GetQuestResult }) => void;
  getQuestThrows: (params: { questId: Quest['id']; error: Error }) => void;
  // The real questGetBroker failure shape, traced through questFindQuestPathBroker's own
  // QuestNotFoundError (packages/orchestrator/src/errors/quest-not-found/quest-not-found-error.ts) —
  // never a hand-typed string.
  getQuestNotFound: (params: { questId: Quest['id'] }) => void;
  getPlanningNotesReturns: (params: { questId: string; result: GetPlanningNotesResult }) => void;
  getPlanningNotesThrows: (params: { questId: string; error: Error }) => void;
  // Every call StartOrchestrator.getPlanningNotes received, first-arg only — mirrors
  // mergeQuestGetCalls. A caller needing the exact forwarded shape filters/reads this itself.
  getPlanningNotesGetCalls: () => readonly unknown[];
  getQuestSummaryReturns: (params: { questId: string; summary: QuestSummary }) => void;
  getQuestSummaryThrows: (params: { questId: string; error: Error }) => void;
  // Every call StartOrchestrator.getQuestSummary received, first-arg only — mirrors
  // mergeQuestGetCalls.
  getQuestSummaryGetCalls: () => readonly unknown[];
  getQuestProjectionReturns: (params: { questId: string; projection: QuestProjection }) => void;
  getQuestProjectionThrows: (params: { questId: string; error: Error }) => void;
  getQuestWorkReturns: (params: { questId: string; result: GetQuestWorkResult }) => void;
  getQuestWorkThrows: (params: { questId: string; error: Error }) => void;
  getQuestWorkDefaultView: () => QuestWorkView;
  // Every call StartOrchestrator.getQuestWork received, first-arg only — mirrors
  // mergeQuestGetCalls. A caller needing one field off a specific call (which of the two shapes —
  // workItemId or operationItemId — actually reached the call) filters/reads this array itself.
  getQuestWorkGetCalls: () => readonly unknown[];
  getBlightChecklistReturns: (params: {
    questId: string;
    result: GetBlightChecklistResult;
  }) => void;
  getBlightChecklistThrows: (params: { questId: string; error: Error }) => void;
  // Every call StartOrchestrator.getBlightChecklist received, first-arg only — mirrors
  // mergeQuestGetCalls. A caller needing the scope a specific call forwarded (never addressed,
  // since two scopes for one questId would otherwise collide) filters/reads this array itself.
  getBlightChecklistGetCalls: () => readonly unknown[];
  getQuestStatusReturns: (params: { processId: ProcessId; status: OrchestrationStatus }) => void;
  getQuestStatusThrows: (params: { processId: ProcessId; error: Error }) => void;
  // Quest mutation methods — OrchestrationFlow / QuestFlow.
  startQuestReturns: (params: { questId: Quest['id']; processId: ProcessId }) => void;
  startQuestThrows: (params: { questId: Quest['id']; error: Error }) => void;
  pauseQuestReturns: (params: { questId: Quest['id']; paused: boolean }) => void;
  pauseQuestThrows: (params: { questId: Quest['id']; error: Error }) => void;
  resumeQuestReturns: (params: {
    questId: Quest['id'];
    resumed: boolean;
    restoredStatus: QuestStatus;
  }) => void;
  resumeQuestThrows: (params: { questId: Quest['id']; error: Error }) => void;
  mergeQuestReturns: (params: { questId: Quest['id']; merging: boolean }) => void;
  mergeQuestThrows: (params: { questId: Quest['id']; error: Error }) => void;
  mergeQuestGetCalls: () => readonly unknown[];
  abandonQuestReturns: (params: { questId: Quest['id']; abandoned: boolean }) => void;
  abandonQuestThrows: (params: { questId: Quest['id']; error: Error }) => void;
  deleteQuestReturns: (params: { questId: Quest['id']; deleted: boolean }) => void;
  deleteQuestThrows: (params: { questId: Quest['id']; error: Error }) => void;
  addQuestReturns: (params: { guildId: GuildId; result: AddQuestResult }) => void;
  addQuestThrows: (params: { guildId: GuildId; error: Error }) => void;
  modifyQuestReturns: (params: { questId?: string; result: ModifyQuestResult }) => void;
  modifyQuestThrows: (params: { questId?: string; error: Error }) => void;
  // Every call StartOrchestrator.modifyQuest received, first-arg only — mirrors mergeQuestGetCalls.
  // A caller composing this proxy that needs one field off a specific call (by questId, the input
  // payload) filters/reads this array itself rather than reaching for the jest mock directly.
  modifyQuestGetCalls: () => readonly unknown[];
  createWorktreeReturns: (params: { name: string; result: CreateWorktreeResult }) => void;
  createWorktreeThrows: (params: { name: string; error: Error }) => void;
  // Every call StartOrchestrator.createWorktree received, first-arg only — mirrors
  // mergeQuestGetCalls.
  createWorktreeGetCalls: () => readonly unknown[];
  // Chat methods — ChatStartFlow / ClarifyAnswerFlow / CommentBatchFlow / ChatReplayFlow.
  startChatReturns: (params: {
    guildId: GuildId;
    chatProcessId: ProcessId;
    questId?: Quest['id'];
  }) => void;
  startChatThrows: (params: { guildId: GuildId; error: Error }) => void;
  // Every call StartOrchestrator.startChat received, first-arg only — mirrors
  // playDispatchGetCalls. A caller composing this proxy that needs one field off a specific call
  // (by guildId, the most recent message, a minted questId) filters/reads this array itself rather
  // than reaching for the jest mock directly.
  startChatGetCalls: () => readonly unknown[];
  clarifyAnswerReturns: (params: { questId: Quest['id']; chatProcessId: ProcessId }) => void;
  clarifyAnswerThrows: (params: { questId: Quest['id']; error: Error }) => void;
  commentBatchReturns: (params: {
    questId: Quest['id'];
    chatProcessId: ProcessId;
    message: string;
  }) => void;
  commentBatchThrows: (params: { questId: Quest['id']; error: Error }) => void;
  // Every call StartOrchestrator.commentBatch received for this questId, as the raw argument lists.
  commentBatchGetCalls: (params: { questId: Quest['id'] }) => RecordedCalls;
  stopAllChatsThrows: (params: { error: Error }) => void;
  stopAllChatsWasCalled: () => boolean;
  replayChatHistorySetupSuccess: () => void;
  replayChatHistorySetupFailure: (params: { error: Error }) => void;
  // Every call StartOrchestrator.replayChatHistory received, first-arg only — mirrors
  // startChatGetCalls/playDispatchGetCalls. Unaddressed on purpose: a caller needing one field off
  // a specific call (the sessionId) filters/reads this array itself.
  replayChatHistoryGetCalls: () => readonly unknown[];
  startFollowupChatReturns: (params: { questId: Quest['id']; chatProcessId: ProcessId }) => void;
  startFollowupChatThrows: (params: { questId: Quest['id']; error: Error }) => void;
  // Every call StartOrchestrator.startFollowupChat received, first-arg only — mirrors
  // startChatGetCalls.
  startFollowupChatGetCalls: () => readonly unknown[];
  stopFollowupChatReturns: (params: { questId: Quest['id']; stopped: boolean }) => void;
  stopFollowupChatThrows: (params: { questId: Quest['id']; error: Error }) => void;
  // Every call StartOrchestrator.stopFollowupChat received, first-arg only — mirrors
  // startChatGetCalls.
  stopFollowupChatGetCalls: () => readonly unknown[];
  // Agent prompt — AgentPromptFlow.
  getAgentPromptReturns: (params: {
    agent: string;
    questId: Quest['id'];
    result: AgentPromptResult;
  }) => void;
  getAgentPromptThrows: (params: { agent: string; questId: Quest['id']; error: Error }) => void;
  // Every call StartOrchestrator.getAgentPrompt received, first-arg only — mirrors
  // startChatGetCalls. A caller needing the exact forwarded shape (e.g. proving a field is ABSENT
  // rather than merely undefined) filters/reads this array itself.
  getAgentPromptGetCalls: () => readonly unknown[];
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
  playDispatchReturns: (params: { state: DispatchState }) => void;
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
  // MCP-driven surface — QuestFlow.mcpCreate / handleSignalBack / getServerConfig / work.
  createQuestForMcpReturns: (params: {
    userRequest: string;
    questId: Quest['id'];
    guildSlug: UrlSlug;
  }) => void;
  createQuestForMcpThrows: (params: { userRequest: string; error: Error }) => void;
  // Every call StartOrchestrator.createQuestForMcp received, first-arg only — mirrors
  // startChatGetCalls. A caller needing the exact forwarded shape (proving an optional field like
  // questType/sessionId reached the call) filters/reads this array itself.
  createQuestForMcpGetCalls: () => readonly unknown[];
  handleSignalBackResolves: (params: { questId?: Quest['id']; workItemId?: QuestWorkItemId }) => void;
  handleSignalBackThrows: (params: {
    questId?: Quest['id'];
    workItemId?: QuestWorkItemId;
    error: Error;
  }) => void;
  getServerConfigReturns: (params: { result: QuestGetServerConfigResult }) => void;
  getServerConfigThrows: (params: { error: Error }) => void;
  questWorkReturns: (params: {
    questId: string;
    workItemId: WorkItem['id'];
    result: QuestWorkResult;
  }) => void;
  questWorkThrows: (params: { questId: string; workItemId: WorkItem['id']; error: Error }) => void;
  // Every call StartOrchestrator.questWork received, first-arg only — mirrors mergeQuestGetCalls.
  // A caller needing the exact forwarded payload (which of the six payload kinds was sent) filters
  // /reads this array itself.
  questWorkGetCalls: () => readonly unknown[];
  // Reverse lookups — QuestFlow.findBySessionId / findByWorkItemId.
  findQuestBySessionIdReturns: (params: { sessionId: SessionId; questId: Quest['id'] | null }) => void;
  findQuestBySessionIdThrows: (params: { sessionId: SessionId; error: Error }) => void;
  findQuestByWorkItemIdReturns: (params: {
    workItemId: QuestWorkItemId;
    questId: Quest['id'] | null;
  }) => void;
  findQuestByWorkItemIdThrows: (params: { workItemId: QuestWorkItemId; error: Error }) => void;
  // Monitor watcher — QuestFlow.startMonitorWatcher.
  startMonitorWatcherResolves: (params: { parentSessionId: string }) => void;
  startMonitorWatcherThrows: (params: { parentSessionId: string; error: Error }) => void;
  startMonitorWatcherWasStopCalled: () => boolean;
  startMonitorWatcherStartedWithWorkerWorkItemId: (params: {
    parentSessionId: string;
    workerWorkItemId: WorkItem['id'];
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
  const handleSignalBackHandle = registerMock({ fn: StartOrchestrator.handleSignalBack });
  const getServerConfigHandle = registerMock({ fn: StartOrchestrator.getServerConfig });
  const questWorkHandle = registerMock({ fn: StartOrchestrator.questWork });
  const findQuestBySessionIdHandle = registerMock({ fn: StartOrchestrator.findQuestBySessionId });
  const findQuestByWorkItemIdHandle = registerMock({ fn: StartOrchestrator.findQuestByWorkItemId });
  const startMonitorWatcherHandle = registerMock({ fn: StartOrchestrator.startMonitorWatcher });

  // The real zero-argument defaults every mcp/server caller already relied on — a test that never
  // sets up its own scenario for one of these still gets the same answer the old per-caller proxies
  // gave it.
  getServerConfigHandle.calledWith([]).returns(QuestGetServerConfigResultStub());
  listGuildsHandle.calledWith([]).resolves([]);
  getRateLimitsHandle.calledWith([]).resolves(null);
  getDispatchStateHandle.calledWith([]).resolves(DispatchStateStub());
  normalizeDispatchBootHandle.calledWith([]).resolves(DispatchStateStub());
  stopAllChatsHandle.calledWith([]).returns(undefined);

  const isObjectArgument = (argument: unknown): boolean =>
    typeof argument === 'object' && argument !== null;

  const monitorWatcherStopState = { called: false };

  return {
    bootstrapSucceeds: (): void => {
      bootstrapHandle.calledWith([]).returns(undefined);
    },
    bootstrapThrows: ({ error }: { error: Error }): void => {
      bootstrapHandle.calledWith([]).throws(error);
    },
    bootstrapGetCalls: (): RecordedCalls => bootstrapHandle.callsMatching([]),
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
    removeGuildResolves: ({ guildId }: { guildId: GuildId }): void => {
      removeGuildHandle.calledWith([{ guildId }]).resolves(undefined);
    },
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
    loadQuestReturns: ({ questId, quest }: { questId: Quest['id']; quest: Quest }): void => {
      loadQuestHandle.calledWith([{ questId }]).resolves(quest);
    },
    loadQuestThrows: ({ questId, error }: { questId: Quest['id']; error: Error }): void => {
      loadQuestHandle.calledWith([{ questId }]).rejects(error);
    },
    loadQuestReturnsOnce: ({ questId, quest }: { questId: Quest['id']; quest: Quest }): void => {
      loadQuestHandle.onceFor([{ questId }]).resolves(quest);
    },
    loadQuestReturnsOnceDelayed: ({
      questId,
      quest,
      delayMs,
    }: {
      questId: Quest['id'];
      quest: Quest;
      delayMs: number;
    }): void => {
      loadQuestHandle.onceFor([{ questId }]).implement(
        async () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve(quest);
            }, delayMs);
          }),
      );
    },
    getQuestReturns: ({ questId, result }: { questId: Quest['id']; result: GetQuestResult }): void => {
      getQuestHandle.calledWith([{ questId }]).resolves(result);
    },
    getQuestThrows: ({ questId, error }: { questId: Quest['id']; error: Error }): void => {
      getQuestHandle.calledWith([{ questId }]).rejects(error);
    },
    getQuestNotFound: ({ questId }: { questId: Quest['id'] }): void => {
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
    getPlanningNotesGetCalls: (): readonly unknown[] =>
      getPlanningNotesHandle.callsMatching([]).map((call) => call[0]),
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
    getQuestSummaryGetCalls: (): readonly unknown[] =>
      getQuestSummaryHandle.callsMatching([]).map((call) => call[0]),
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
    getQuestWorkGetCalls: (): readonly unknown[] =>
      getQuestWorkHandle.callsMatching([]).map((call) => call[0]),
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
    getBlightChecklistGetCalls: (): readonly unknown[] =>
      getBlightChecklistHandle.callsMatching([]).map((call) => call[0]),
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
      questId: Quest['id'];
      processId: ProcessId;
    }): void => {
      startQuestHandle.calledWith([{ questId }]).resolves(processId);
    },
    startQuestThrows: ({ questId, error }: { questId: Quest['id']; error: Error }): void => {
      startQuestHandle.calledWith([{ questId }]).rejects(error);
    },
    pauseQuestReturns: ({ questId, paused }: { questId: Quest['id']; paused: boolean }): void => {
      pauseQuestHandle.calledWith([{ questId }]).resolves({ paused });
    },
    pauseQuestThrows: ({ questId, error }: { questId: Quest['id']; error: Error }): void => {
      pauseQuestHandle.calledWith([{ questId }]).rejects(error);
    },
    resumeQuestReturns: ({
      questId,
      resumed,
      restoredStatus,
    }: {
      questId: Quest['id'];
      resumed: boolean;
      restoredStatus: QuestStatus;
    }): void => {
      resumeQuestHandle.calledWith([{ questId }]).resolves({ resumed, restoredStatus });
    },
    resumeQuestThrows: ({ questId, error }: { questId: Quest['id']; error: Error }): void => {
      resumeQuestHandle.calledWith([{ questId }]).rejects(error);
    },
    mergeQuestReturns: ({ questId, merging }: { questId: Quest['id']; merging: boolean }): void => {
      mergeQuestHandle.calledWith([{ questId }]).resolves({ merging });
    },
    mergeQuestThrows: ({ questId, error }: { questId: Quest['id']; error: Error }): void => {
      mergeQuestHandle.calledWith([{ questId }]).rejects(error);
    },
    // Unaddressed on purpose: a status-gate test needs to prove the call was reached ZERO times.
    mergeQuestGetCalls: (): readonly unknown[] =>
      mergeQuestHandle.callsMatching([]).map(([firstArg]: readonly unknown[]) => firstArg),
    abandonQuestReturns: ({
      questId,
      abandoned,
    }: {
      questId: Quest['id'];
      abandoned: boolean;
    }): void => {
      abandonQuestHandle.calledWith([{ questId }]).resolves({ abandoned });
    },
    abandonQuestThrows: ({ questId, error }: { questId: Quest['id']; error: Error }): void => {
      abandonQuestHandle.calledWith([{ questId }]).rejects(error);
    },
    deleteQuestReturns: ({ questId, deleted }: { questId: Quest['id']; deleted: boolean }): void => {
      deleteQuestHandle.calledWith([{ questId }]).resolves({ deleted });
    },
    deleteQuestThrows: ({ questId, error }: { questId: Quest['id']; error: Error }): void => {
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
    // Unaddressed on purpose, mirroring mergeQuestGetCalls: a caller needing one field off a
    // specific call (questId, the input payload) filters/reads this itself.
    modifyQuestGetCalls: (): readonly unknown[] =>
      modifyQuestHandle.callsMatching([]).map((call) => call[0]),
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
    createWorktreeGetCalls: (): readonly unknown[] =>
      createWorktreeHandle.callsMatching([]).map((call) => call[0]),
    startChatReturns: ({
      guildId,
      chatProcessId,
      questId,
    }: {
      guildId: GuildId;
      chatProcessId: ProcessId;
      questId?: Quest['id'];
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
      questId: Quest['id'];
      chatProcessId: ProcessId;
    }): void => {
      clarifyAnswerHandle.calledWith([{ questId }]).resolves({ chatProcessId });
    },
    clarifyAnswerThrows: ({ questId, error }: { questId: Quest['id']; error: Error }): void => {
      clarifyAnswerHandle.calledWith([{ questId }]).rejects(error);
    },
    commentBatchReturns: ({
      questId,
      chatProcessId,
      message,
    }: {
      questId: Quest['id'];
      chatProcessId: ProcessId;
      message: string;
    }): void => {
      commentBatchHandle.calledWith([{ questId }]).resolves({ chatProcessId, message });
    },
    commentBatchThrows: ({ questId, error }: { questId: Quest['id']; error: Error }): void => {
      commentBatchHandle.calledWith([{ questId }]).rejects(error);
    },
    commentBatchGetCalls: ({ questId }: { questId: Quest['id'] }): RecordedCalls =>
      commentBatchHandle.callsMatching([{ questId }]),
    // stopAllChats takes no arguments — calledWith([]) is the honest description of that call.
    stopAllChatsThrows: ({ error }: { error: Error }): void => {
      stopAllChatsHandle.calledWith([]).throws(error);
    },
    stopAllChatsWasCalled: (): boolean => stopAllChatsHandle.callsMatching([]).length > 0,
    // Any `{ ... }` call: the adapter discards whatever replayChatHistory resolves to (it always
    // returns { success: true } itself), and callers set up a blanket success/failure without
    // knowing which session the flow under test resolves to.
    replayChatHistorySetupSuccess: (): void => {
      replayChatHistoryHandle.calledWith([isObjectArgument]).resolves(undefined);
    },
    replayChatHistorySetupFailure: ({ error }: { error: Error }): void => {
      replayChatHistoryHandle.calledWith([isObjectArgument]).rejects(error);
    },
    replayChatHistoryGetCalls: (): readonly unknown[] =>
      replayChatHistoryHandle.callsMatching([]).map((call) => call[0]),
    startFollowupChatReturns: ({
      questId,
      chatProcessId,
    }: {
      questId: Quest['id'];
      chatProcessId: ProcessId;
    }): void => {
      startFollowupChatHandle.calledWith([{ questId }]).resolves({ chatProcessId });
    },
    startFollowupChatThrows: ({ questId, error }: { questId: Quest['id']; error: Error }): void => {
      startFollowupChatHandle.calledWith([{ questId }]).rejects(error);
    },
    startFollowupChatGetCalls: (): readonly unknown[] =>
      startFollowupChatHandle.callsMatching([]).map((call) => call[0]),
    stopFollowupChatReturns: ({
      questId,
      stopped,
    }: {
      questId: Quest['id'];
      stopped: boolean;
    }): void => {
      stopFollowupChatHandle.calledWith([{ questId }]).resolves({ stopped });
    },
    stopFollowupChatThrows: ({ questId, error }: { questId: Quest['id']; error: Error }): void => {
      stopFollowupChatHandle.calledWith([{ questId }]).rejects(error);
    },
    stopFollowupChatGetCalls: (): readonly unknown[] =>
      stopFollowupChatHandle.callsMatching([]).map((call) => call[0]),
    getAgentPromptReturns: ({
      agent,
      questId,
      result,
    }: {
      agent: string;
      questId: Quest['id'];
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
      questId: Quest['id'];
      error: Error;
    }): void => {
      getAgentPromptHandle.calledWith([{ agent, questId }]).rejects(error);
    },
    // Unaddressed on purpose, mirroring startChatGetCalls: a caller needing one field off a
    // specific call (which optional keys were actually forwarded) filters/reads this itself.
    getAgentPromptGetCalls: (): readonly unknown[] =>
      getAgentPromptHandle.callsMatching([]).map((call) => call[0]),
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
    // playDispatch takes no arguments — [] is the only possible, exhaustive address.
    playDispatchReturns: ({ state }: { state: DispatchState }): void => {
      playDispatchHandle.calledWith([]).resolves(state);
    },
    playDispatchThrows: ({ error }: { error: Error }): void => {
      playDispatchHandle.calledWith([]).rejects(error);
    },
    // Raw calls, not first-arg: playDispatch takes no arguments, so a first-arg map would read every
    // call back as `undefined`. One call reads `[[]]`.
    playDispatchGetCalls: (): readonly unknown[] =>
      playDispatchHandle.callsMatching([]).map((call) => call),
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
      questId: Quest['id'];
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
    createQuestForMcpGetCalls: (): readonly unknown[] =>
      createQuestForMcpHandle.callsMatching([]).map((call) => call[0]),
    // questId/workItemId optional: a fire-and-forget caller that never reads the result and does
    // not know the address ahead of time can stage a real wildcard via calledWith([]).
    handleSignalBackResolves: ({
      questId,
      workItemId,
    }: {
      questId?: Quest['id'];
      workItemId?: QuestWorkItemId;
    }): void => {
      const address =
        questId === undefined || workItemId === undefined ? [] : [{ questId, workItemId }];
      handleSignalBackHandle.calledWith(address).resolves(undefined);
    },
    handleSignalBackThrows: ({
      questId,
      workItemId,
      error,
    }: {
      questId?: Quest['id'];
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
      workItemId: WorkItem['id'];
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
      workItemId: WorkItem['id'];
      error: Error;
    }): void => {
      questWorkHandle.calledWith([{ questId, workItemId }]).rejects(error);
    },
    questWorkGetCalls: (): readonly unknown[] =>
      questWorkHandle.callsMatching([]).map((call) => call[0]),
    findQuestBySessionIdReturns: ({
      sessionId,
      questId,
    }: {
      sessionId: SessionId;
      questId: Quest['id'] | null;
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
      questId: Quest['id'] | null;
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
    // Every tailed session is a worker session, started WITH its owning workItemId and questId.
    startMonitorWatcherStartedWithWorkerWorkItemId: ({
      parentSessionId,
      workerWorkItemId,
    }: {
      parentSessionId: string;
      workerWorkItemId: WorkItem['id'];
    }): boolean =>
      startMonitorWatcherHandle.callsMatching([{ parentSessionId, workerWorkItemId }]).length > 0,
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
