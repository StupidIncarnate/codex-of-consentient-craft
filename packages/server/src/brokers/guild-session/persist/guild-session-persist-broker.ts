/**
 * PURPOSE: Persists a new active chat session to a guild, deactivating all previous sessions
 *
 * USAGE:
 * guildSessionPersistBroker({ guildId: 'abc-123', sessionId: SessionIdStub() });
 * // Reads guild, deactivates existing sessions, appends new active session, writes back
 */

import { chatSessionContract, guildIdContract } from '@dungeonmaster/shared/contracts';
import type { SessionId } from '@dungeonmaster/shared/contracts';

import { orchestratorGetGuildAdapter } from '../../../adapters/orchestrator/get-guild/orchestrator-get-guild-adapter';
import { orchestratorUpdateGuildAdapter } from '../../../adapters/orchestrator/update-guild/orchestrator-update-guild-adapter';
import { processDevLogAdapter } from '../../../adapters/process/dev-log/process-dev-log-adapter';

export const guildSessionPersistBroker = async ({
  guildId,
  sessionId,
}: {
  guildId: string;
  sessionId: SessionId;
}): Promise<void> => {
  try {
    const guildIdParsed = guildIdContract.parse(guildId);
    const guild = await orchestratorGetGuildAdapter({ guildId: guildIdParsed });
    const deactivated = guild.chatSessions.map((s) =>
      chatSessionContract.parse({ ...s, active: false }),
    );
    const newSession = chatSessionContract.parse({
      sessionId,
      agentRole: 'chaoswhisperer',
      startedAt: new Date().toISOString(),
      active: true,
    });
    await orchestratorUpdateGuildAdapter({
      guildId: guildIdParsed,
      chatSessions: [...deactivated, newSession],
    });
    processDevLogAdapter({
      message: `Session persisted to guild: guildId=${guildId}, sessionId=${sessionId}`,
    });
  } catch (error: unknown) {
    processDevLogAdapter({
      message: `Failed to persist guild session: guildId=${guildId}, error=${error instanceof Error ? error.message : 'unknown'}`,
    });
  }
};
