/**
 * PURPOSE: Adapter for StartOrchestrator.startChat that wraps the orchestrator package
 *
 * USAGE:
 * const { chatProcessId, questId } = await orchestratorStartChatAdapter({ guildId, message });
 * // Returns: { chatProcessId: ProcessId, questId?: QuestId } or throws error
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { GuildId, ProcessId, QuestId, SessionId } from '@dungeonmaster/shared/contracts';

export const orchestratorStartChatAdapter = async ({
  guildId,
  message,
  sessionId,
}: {
  guildId: GuildId;
  message: string;
  sessionId?: SessionId;
}): Promise<{ chatProcessId: ProcessId; questId?: QuestId }> =>
  StartOrchestrator.startChat({ guildId, message, ...(sessionId && { sessionId }) });
