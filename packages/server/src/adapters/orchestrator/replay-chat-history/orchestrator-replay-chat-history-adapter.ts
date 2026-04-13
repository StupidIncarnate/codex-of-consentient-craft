/**
 * PURPOSE: Adapter for StartOrchestrator.replayChatHistory that wraps the orchestrator package
 *
 * USAGE:
 * await orchestratorReplayChatHistoryAdapter({ sessionId, guildId, chatProcessId });
 * // Replays chat history for a session via the orchestrator
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { AdapterResult, GuildId, ProcessId, SessionId } from '@dungeonmaster/shared/contracts';

export const orchestratorReplayChatHistoryAdapter = async ({
  sessionId,
  guildId,
  chatProcessId,
}: {
  sessionId: SessionId;
  guildId: GuildId;
  chatProcessId: ProcessId;
}): Promise<AdapterResult> => {
  await StartOrchestrator.replayChatHistory({ sessionId, guildId, chatProcessId });

  return { success: true as const };
};
