/**
 * PURPOSE: Adapter for StartOrchestrator.replayChatHistory that wraps the orchestrator package
 *
 * USAGE:
 * await orchestratorReplayChatHistoryAdapter({ sessionId, guildId, chatProcessId });
 * // Replays chat history for a session via the orchestrator
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type {
  AdapterResult,
  AgentId,
  GuildId,
  ProcessId,
  SessionId,
} from '@dungeonmaster/shared/contracts';

export const orchestratorReplayChatHistoryAdapter = async ({
  sessionId,
  agentId,
  guildId,
  chatProcessId,
}: {
  sessionId: SessionId;
  agentId?: AgentId;
  guildId: GuildId;
  chatProcessId: ProcessId;
}): Promise<AdapterResult> => {
  await StartOrchestrator.replayChatHistory({
    sessionId,
    ...(agentId && { agentId }),
    guildId,
    chatProcessId,
  });

  return { success: true as const };
};
