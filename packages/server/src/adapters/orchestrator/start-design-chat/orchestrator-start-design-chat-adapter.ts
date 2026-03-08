/**
 * PURPOSE: Adapter for StartOrchestrator.startDesignChat that wraps the orchestrator package
 *
 * USAGE:
 * const { chatProcessId } = await orchestratorStartDesignChatAdapter({ questId, guildId, message });
 * // Returns: { chatProcessId: ProcessId } or throws error
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { GuildId, ProcessId, QuestId } from '@dungeonmaster/shared/contracts';

export const orchestratorStartDesignChatAdapter = async ({
  questId,
  guildId,
  message,
}: {
  questId: QuestId;
  guildId: GuildId;
  message: string;
}): Promise<{ chatProcessId: ProcessId }> =>
  StartOrchestrator.startDesignChat({ questId, guildId, message });
