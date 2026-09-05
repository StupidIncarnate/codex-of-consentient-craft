/**
 * PURPOSE: Adapter for StartOrchestrator.startChat that wraps the orchestrator package
 *
 * USAGE:
 * const { chatProcessId, questId } = await orchestratorStartChatAdapter({ guildId, message });
 * // Returns: { chatProcessId: ProcessId, questId?: QuestId } or throws error
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type {
  GuildId,
  ProcessId,
  QuestId,
  QuestType,
  SessionId,
} from '@dungeonmaster/shared/contracts';

export const orchestratorStartChatAdapter = async ({
  guildId,
  message,
  questType,
  mintedQuestId,
  existingQuestId,
  sessionId,
}: {
  guildId: GuildId;
  message: string;
  questType?: QuestType;
  // A pre-minted id — the create route mints one itself when the request carries images, so the
  // quest gets created under the SAME folder pastedImagePersistBroker already wrote them to.
  mintedQuestId?: QuestId;
  // The main quest-chat route's own URL questId — that route has already loaded this exact quest
  // off disk before calling here, so it is never a guess. A missing `sessionId` alongside it means
  // only "no session captured yet", never "mint a different quest" (resolveChatQuestLayerBroker's
  // header, in @dungeonmaster/orchestrator, has the full rationale).
  existingQuestId?: QuestId;
  sessionId?: SessionId;
}): Promise<{ chatProcessId: ProcessId; questId?: QuestId }> =>
  StartOrchestrator.startChat({
    guildId,
    message,
    ...(questType && { questType }),
    ...(mintedQuestId && { mintedQuestId }),
    ...(existingQuestId && { existingQuestId }),
    ...(sessionId && { sessionId }),
  });
