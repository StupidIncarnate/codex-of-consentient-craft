/**
 * PURPOSE: Adapter for StartOrchestrator.startFollowupChat that wraps the orchestrator package
 *
 * USAGE:
 * const { chatProcessId } = await orchestratorStartFollowupChatAdapter({ questId, guildId, message });
 * // Returns: { chatProcessId: ProcessId } or throws error
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { GuildId, ProcessId, QuestId } from '@dungeonmaster/shared/contracts';

export const orchestratorStartFollowupChatAdapter = async ({
  questId,
  guildId,
  message,
}: {
  questId: QuestId;
  guildId: GuildId;
  message: string;
}): Promise<{ chatProcessId: ProcessId }> =>
  StartOrchestrator.startFollowupChat({ questId, guildId, message });
