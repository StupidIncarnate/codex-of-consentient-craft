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
 */

import type {
  AdapterResult,
  AddQuestResult,
  AgentPromptResult,
  DirectoryEntry,
  GetQuestResult,
  Guild,
  GuildId,
  GuildListItem,
  GuildName,
  GuildPath,
  ModifyQuestInput,
  ModifyQuestResult,
  OrchestrationStatus,
  ProcessId,
  Quest,
  QuestId,
  QuestListItem,
  QuestQueueEntry,
  QuestStatus,
  SessionId,
} from '@dungeonmaster/shared/contracts';

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
import { OrchestrationFlow } from '../flows/orchestration/orchestration-flow';
import { QuestFlow } from '../flows/quest/quest-flow';
import { SmoketestFlow } from '../flows/smoketest/smoketest-flow';
import { StartupRecoveryFlow } from '../flows/startup-recovery/startup-recovery-flow';

// Bootstrap the cross-guild execution-queue runner on module load. Idempotent.
ExecutionQueueFlow.bootstrap();

// Bootstrap the queue sync listener on module load. Keeps queue entries in sync with
// quest file changes (abandon/complete/delete) so the runner can always advance. Idempotent.
ExecutionQueueFlow.bootstrapSyncListener();

// Bootstrap the smoketest post-terminal listener on module load. Idempotent.
SmoketestFlow.bootstrap();

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
    section?: 'scope' | 'surface' | 'synthesis' | 'walk' | 'review' | 'blight';
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
    guildId,
    chatProcessId,
  }: {
    sessionId: SessionId;
    guildId: GuildId;
    chatProcessId?: ProcessId;
  }): Promise<AdapterResult> =>
    ChatReplayFlow({ sessionId, guildId, ...(chatProcessId && { chatProcessId }) }),

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
  getAgentPrompt: ({ agent }: { agent: string }): AgentPromptResult =>
    AgentPromptFlow.get({ agent }),

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

  setWebPresence: ({ isPresent }: { isPresent: boolean }): AdapterResult =>
    ExecutionQueueFlow.setWebPresence({ isPresent }),
};
