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
 */

import type {
  DirectoryEntry,
  Guild,
  GuildId,
  GuildListItem,
  GuildName,
  GuildPath,
  OrchestrationStatus,
  ProcessId,
  Quest,
  QuestId,
  QuestListItem,
  SessionId,
} from '@dungeonmaster/shared/contracts';

import type { AddQuestResult } from '../contracts/add-quest-result/add-quest-result-contract';
import type { GetQuestResult } from '../contracts/get-quest-result/get-quest-result-contract';
import type { ModifyQuestInput } from '../contracts/modify-quest-input/modify-quest-input-contract';
import type { ModifyQuestResult } from '../contracts/modify-quest-result/modify-quest-result-contract';
import type { VerifyQuestResult } from '../contracts/verify-quest-result/verify-quest-result-contract';
import { ChatReplayFlow } from '../flows/chat-replay/chat-replay-flow';
import { ChatStartFlow } from '../flows/chat-start/chat-start-flow';
import { ChatStopFlow } from '../flows/chat-stop/chat-stop-flow';
import { ChatStopAllFlow } from '../flows/chat-stop-all/chat-stop-all-flow';
import { DesignChatStartFlow } from '../flows/design-chat-start/design-chat-start-flow';
import { DirectoryFlow } from '../flows/directory/directory-flow';
import { GuildFlow } from '../flows/guild/guild-flow';
import { OrchestrationFlow } from '../flows/orchestration/orchestration-flow';
import { QuestFlow } from '../flows/quest/quest-flow';

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

  removeGuild: async ({ guildId }: { guildId: GuildId }): Promise<void> =>
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

  verifyQuest: async ({ questId }: { questId: string }): Promise<VerifyQuestResult> =>
    QuestFlow.verify({ questId }),

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
  }): Promise<{ chatProcessId: ProcessId }> =>
    ChatStartFlow({ guildId, message, ...(sessionId && { sessionId }) }),

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
  }): Promise<void> =>
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
};
