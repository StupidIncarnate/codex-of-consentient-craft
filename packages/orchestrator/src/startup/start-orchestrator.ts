/**
 * PURPOSE: Public API for the orchestrator package providing guild management, quest management, and orchestration functions
 *
 * USAGE:
 * import { StartOrchestrator } from '@dungeonmaster/orchestrator';
 * const guilds = await StartOrchestrator.listGuilds();
 * const quests = await StartOrchestrator.listQuests({guildId});
 * const quest = await StartOrchestrator.loadQuest({questId});
 * const added = await StartOrchestrator.addQuest({title: 'Add Auth', userRequest: 'User wants...', guildId});
 * const got = await StartOrchestrator.getQuest({questId: 'add-auth'});
 * const modified = await StartOrchestrator.modifyQuest({questId: 'add-auth', input: {...}});
 * const recovered = await StartOrchestrator.recoverActiveQuests();
 * const bySession = await StartOrchestrator.findQuestBySessionId({ sessionId });
 */

import type {
  AdapterResult,
  AddQuestInput,
  AddQuestResult,
  AgentId,
  AgentPromptResult,
  DirectoryEntry,
  DispatchState,
  GetQuestResult,
  Guild,
  GuildId,
  GuildListItem,
  GuildName,
  GuildPath,
  ModifyQuestInput,
  ModifyQuestResult,
  OperationItemId,
  OrchestrationMode,
  OrchestrationStatus,
  ProcessId,
  Quest,
  QuestId,
  QuestListItem,
  QuestQueueEntry,
  QuestStatus,
  QuestType,
  QuestWorkItemId,
  RateLimitsSnapshot,
  SessionId,
  UrlSlug,
} from '@dungeonmaster/shared/contracts';

import type { DispatchPlayResponse } from '../contracts/dispatch-play-response/dispatch-play-response-contract';
import type { NextStep } from '../contracts/next-step/next-step-contract';
import type { QuestGetServerConfigResult } from '../contracts/quest-get-server-config-result/quest-get-server-config-result-contract';
import type { QuestRunWardResult } from '../contracts/quest-run-ward-result/quest-run-ward-result-contract';

import type { ClarificationQuestion } from '../contracts/clarification-question/clarification-question-contract';
import { AgentPromptFlow } from '../flows/agent-prompt/agent-prompt-flow';
import { ChatReplayFlow } from '../flows/chat-replay/chat-replay-flow';
import { ChatStartFlow } from '../flows/chat-start/chat-start-flow';
import { ClarifyAnswerFlow } from '../flows/clarify-answer/clarify-answer-flow';
import { ChatStopFlow } from '../flows/chat-stop/chat-stop-flow';
import { ChatStopAllFlow } from '../flows/chat-stop-all/chat-stop-all-flow';
import { DesignChatStartFlow } from '../flows/design-chat-start/design-chat-start-flow';
import { DirectoryFlow } from '../flows/directory/directory-flow';
import { ExecutionQueueFlow } from '../flows/execution-queue/execution-queue-flow';
import { GuildFlow } from '../flows/guild/guild-flow';
import { OrchestrationDispatchFlow } from '../flows/orchestration-dispatch/orchestration-dispatch-flow';
import { OrchestrationFlow } from '../flows/orchestration/orchestration-flow';
import { ProcessStaleWatchFlow } from '../flows/process-stale-watch/process-stale-watch-flow';
import { QuestFlow } from '../flows/quest/quest-flow';
import { RateLimitsFlow } from '../flows/rate-limits/rate-limits-flow';
import { SmoketestFlow } from '../flows/smoketest/smoketest-flow';
import { StartupRecoveryFlow } from '../flows/startup-recovery/startup-recovery-flow';

// Bootstrap the cross-guild execution-queue runner on module load. Idempotent.
ExecutionQueueFlow.bootstrap();

// Bootstrap the queue sync listener on module load. Keeps queue entries in sync with
// quest file changes (abandon/complete/delete) so the runner can always advance. Idempotent.
ExecutionQueueFlow.bootstrapSyncListener();

// Bootstrap the Node dispatch runner on module load. Normalizes the persisted play/pause
// state to paused (never auto-plays across a restart) and wires the runner's wake sources.
// Idempotent.
OrchestrationDispatchFlow.bootstrap();

// Bootstrap the smoketest post-terminal listener on module load. Idempotent.
SmoketestFlow.bootstrap();

// Bootstrap the rate-limits.json watcher on module load. Idempotent.
RateLimitsFlow.bootstrap();

// Bootstrap the stale-process watchdog on module load. Idempotent.
// Scans the orchestration-processes registry every 30s and emits a [dev] WARN line
// to stderr for any registered process whose stdout has been silent past the 60s
// threshold. Includes OS-level kill(pid, 0) liveness probe when an osPid is known.
ProcessStaleWatchFlow.bootstrap();

export const StartOrchestrator = {
  // Guild methods
  listGuilds: async (): Promise<GuildListItem[]> => GuildFlow.list(),

  getGuild: async ({ guildId }: { guildId: GuildId }): Promise<Guild> => GuildFlow.get({ guildId }),

  addGuild: async ({ name, path }: { name: GuildName; path: GuildPath }): Promise<Guild> =>
    GuildFlow.add({ name, path }),

  updateGuild: async ({
    guildId,
    name,
    path,
  }: {
    guildId: GuildId;
    name?: GuildName;
    path?: GuildPath;
  }): Promise<Guild> =>
    GuildFlow.update({
      guildId,
      ...(name !== undefined && { name }),
      ...(path !== undefined && { path }),
    }),

  removeGuild: async ({ guildId }: { guildId: GuildId }): Promise<AdapterResult> =>
    GuildFlow.remove({ guildId }),

  browseDirectories: ({ path }: { path?: GuildPath }): DirectoryEntry[] =>
    DirectoryFlow({ ...(path !== undefined && { path }) }),

  // Quest methods
  listQuests: async ({ guildId }: { guildId: GuildId }): Promise<QuestListItem[]> =>
    QuestFlow.list({ guildId }),

  loadQuest: async ({ questId }: { questId: QuestId }): Promise<Quest> =>
    QuestFlow.load({ questId }),

  startQuest: async ({ questId }: { questId: QuestId }): Promise<ProcessId> =>
    OrchestrationFlow.start({ questId }),

  pauseQuest: async ({ questId }: { questId: QuestId }): Promise<{ paused: boolean }> =>
    OrchestrationFlow.pause({ questId }),

  resumeQuest: async ({
    questId,
  }: {
    questId: QuestId;
  }): Promise<{ resumed: boolean; restoredStatus: QuestStatus }> =>
    OrchestrationFlow.resume({ questId }),

  abandonQuest: async ({ questId }: { questId: QuestId }): Promise<{ abandoned: boolean }> =>
    OrchestrationFlow.abandon({ questId }),

  deleteQuest: async ({
    questId,
    guildId,
  }: {
    questId: QuestId;
    guildId: GuildId;
  }): Promise<{ deleted: boolean }> => OrchestrationFlow.delete({ questId, guildId }),

  getQuestStatus: ({ processId }: { processId: ProcessId }): OrchestrationStatus =>
    OrchestrationFlow.getStatus({ processId }),

  addQuest: async ({
    title,
    userRequest,
    guildId,
  }: {
    title: string;
    userRequest: string;
    guildId: GuildId;
  }): Promise<AddQuestResult> => QuestFlow.add({ title, userRequest, guildId }),

  getQuest: async ({
    questId,
    stage,
  }: {
    questId: string;
    stage?: string;
  }): Promise<GetQuestResult> => QuestFlow.get({ questId, ...(stage !== undefined && { stage }) }),

  getPlanningNotes: async ({
    questId,
    section,
  }: {
    questId: string;
    section?: 'blight';
  }): Promise<Awaited<ReturnType<typeof QuestFlow.getPlanningNotes>>> =>
    QuestFlow.getPlanningNotes({ questId, ...(section !== undefined && { section }) }),

  modifyQuest: async ({
    questId,
    input,
  }: {
    questId: string;
    input: ModifyQuestInput;
  }): Promise<ModifyQuestResult> => QuestFlow.modify({ questId, input }),

  // Chat methods
  startChat: async ({
    guildId,
    message,
    sessionId,
  }: {
    guildId: GuildId;
    message: string;
    sessionId?: SessionId;
  }): Promise<{ chatProcessId: ProcessId; questId?: QuestId }> =>
    ChatStartFlow({ guildId, message, ...(sessionId && { sessionId }) }),

  clarifyAnswer: async ({
    guildId,
    sessionId,
    questId,
    answers,
    questions,
  }: {
    guildId: GuildId;
    sessionId: SessionId;
    questId: QuestId;
    answers: { header: string; label: string }[];
    questions: ClarificationQuestion[];
  }): Promise<{ chatProcessId: ProcessId }> =>
    ClarifyAnswerFlow({ guildId, sessionId, questId, answers, questions }),

  stopChat: ({ chatProcessId }: { chatProcessId: ProcessId }): boolean =>
    ChatStopFlow({ chatProcessId }),

  stopAllChats: (): void => {
    ChatStopAllFlow();
  },

  replayChatHistory: async ({
    sessionId,
    agentId,
    guildId,
    chatProcessId,
  }: {
    sessionId: SessionId;
    agentId?: AgentId;
    guildId: GuildId;
    chatProcessId?: ProcessId;
  }): Promise<AdapterResult> =>
    ChatReplayFlow({
      sessionId,
      guildId,
      ...(agentId && { agentId }),
      ...(chatProcessId && { chatProcessId }),
    }),

  // Design chat methods
  startDesignChat: async ({
    questId,
    guildId,
    message,
  }: {
    questId: QuestId;
    guildId: GuildId;
    message: string;
  }): Promise<{ chatProcessId: ProcessId }> => DesignChatStartFlow({ questId, guildId, message }),

  // Agent prompt methods
  getAgentPrompt: async ({
    agent,
    questId,
    workItemId,
  }: {
    agent: string;
    questId: QuestId;
    workItemId?: QuestWorkItemId;
  }): Promise<AgentPromptResult> =>
    AgentPromptFlow.get({
      agent,
      questId,
      ...(workItemId !== undefined && { workItemId }),
    }),

  // Recovery methods
  recoverActiveQuests: async (): Promise<QuestId[]> => StartupRecoveryFlow(),

  // Smoketest methods
  runSmoketest: async ({
    suite,
    startPath,
  }: Parameters<typeof SmoketestFlow.run>[0]): Promise<
    Awaited<ReturnType<typeof SmoketestFlow.run>>
  > => SmoketestFlow.run({ suite, startPath }),

  getSmoketestState: (): ReturnType<typeof SmoketestFlow.getState> => SmoketestFlow.getState(),

  // Execution queue
  getExecutionQueue: async (): Promise<readonly QuestQueueEntry[]> => ExecutionQueueFlow.getAll(),

  // Node dispatcher play/pause (the /queue page's control surface)
  getDispatchState: async (): Promise<DispatchState> => OrchestrationDispatchFlow.get(),

  playDispatch: async ({ force }: { force?: boolean }): Promise<DispatchPlayResponse> =>
    OrchestrationDispatchFlow.play({ ...(force !== undefined && { force }) }),

  pauseDispatch: async (): Promise<DispatchState> => OrchestrationDispatchFlow.pause(),

  // Declared orchestrationMode (claude | node) from .dungeonmaster.json — the web reads this to decide
  // whether the create-quest surface is web-driven (node) or terminal-driven via /dumpster-create (claude).
  getOrchestrationMode: async (): Promise<OrchestrationMode> => OrchestrationDispatchFlow.getMode(),

  // Server-boot-only: rewrites a persisted node-playing mode to paused. Called by the HTTP
  // server's StartServer, never by MCP children (their StartOrchestrator load must not flip
  // the shared dispatch state mid-play).
  normalizeDispatchBoot: async (): Promise<DispatchState> =>
    OrchestrationDispatchFlow.normalizeBoot(),

  // Rate limits
  getRateLimits: (): RateLimitsSnapshot | null => RateLimitsFlow.get(),

  // MCP-driven create-quest (ChaosWhisperer at /dumpster-create startup,
  // BugHunt at /dumpster-hunt startup which passes questType: 'bug-hunt')
  createQuestForMcp: async ({
    userRequest,
    questType,
    sessionId,
  }: {
    userRequest: AddQuestInput['userRequest'];
    questType?: QuestType;
    sessionId?: SessionId;
  }): Promise<{ questId: QuestId; guildSlug: UrlSlug }> =>
    QuestFlow.mcpCreate({
      userRequest,
      ...(questType !== undefined && { questType }),
      ...(sessionId !== undefined && { sessionId }),
    }),

  // MCP-driven get-next-step (/dumpster-launch dispatch loop)
  getNextStep: async (): Promise<NextStep> => QuestFlow.getNextStep(),

  // MCP-driven run-ward (synchronous ward run + persist)
  runWard: async ({
    questId,
    workItemId,
    mode,
  }: {
    questId: QuestId;
    workItemId: QuestWorkItemId;
    mode: 'changed' | 'full';
  }): Promise<QuestRunWardResult> => QuestFlow.runWard({ questId, workItemId, mode }),

  // MCP-driven signal-back post-processing — applies the session's operation outcome
  // (done/partial) to the ledger atomically, then advances the relay.
  handleSignalBack: async ({
    questId,
    workItemId,
    signal,
    operationItemId,
    operationStatus,
  }: {
    questId: QuestId;
    workItemId: QuestWorkItemId;
    signal: 'complete';
    operationItemId?: OperationItemId;
    operationStatus?: 'done' | 'partial';
  }): Promise<AdapterResult> =>
    QuestFlow.handleSignalBack({
      questId,
      workItemId,
      signal,
      ...(operationItemId === undefined ? {} : { operationItemId }),
      ...(operationStatus === undefined ? {} : { operationStatus }),
    }),

  // MCP-driven get-server-config (slash commands resolve baseUrl + port)
  getServerConfig: (): QuestGetServerConfigResult => QuestFlow.getServerConfig(),

  // Reverse lookup: sessionId -> QuestId (or null when no quest's chaoswhisperer workItem
  // has this sessionId). Used by the HTTP server's GET /api/quests/by-session/:sessionId
  // endpoint so the PostToolUse hook can find the quest to PATCH design decisions onto.
  findQuestBySessionId: async ({ sessionId }: { sessionId: SessionId }): Promise<QuestId | null> =>
    QuestFlow.findBySessionId({ sessionId }),

  // Reverse lookup: workItemId -> QuestId (or null when no quest owns it). Used by the
  // HTTP server's chat-output broadcaster to stamp questId on outgoing WS payloads.
  findQuestByWorkItemId: async ({
    workItemId,
  }: {
    workItemId: QuestWorkItemId;
  }): Promise<QuestId | null> => QuestFlow.findByWorkItemId({ workItemId }),

  // Start a JSONL watcher against a parent Claude Code session whose id is stamped on
  // an in-progress workItem. Called by the server's quest-driven watcher reactor for
  // each distinct sessionId in the active workItem set; multiple instances coexist.
  startMonitorWatcher: async ({
    parentSessionId,
    projectDir,
    ...workerParams
  }: {
    parentSessionId: string;
    projectDir: string;
    // Present when the tailed session is a top-level node-dispatch worker (work item has
    // a sessionId but no agentId). Routes its main-session output to the work item's row
    // instead of dropping it as /dumpster-launch dispatcher chatter.
    workerWorkItemId?: string;
  }): Promise<{ stop: () => void }> =>
    QuestFlow.startMonitorWatcher({ parentSessionId, projectDir, ...workerParams }),
};
