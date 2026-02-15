/**
 * PURPOSE: Upserts an active chat session to a guild, deactivating all other sessions
 *
 * USAGE:
 * guildSessionPersistBroker({ guildId: 'abc-123', sessionId: SessionIdStub() });
 * // Reads guild, if sessionId exists updates it in place, otherwise appends new entry
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
    const existingIndex = guild.chatSessions.findIndex((s) => s.sessionId === sessionId);
    const updatedSessions =
      existingIndex >= 0
        ? guild.chatSessions.map((s, idx) =>
            chatSessionContract.parse({
              ...s,
              active: idx === existingIndex,
              ...(idx === existingIndex ? { startedAt: new Date().toISOString() } : {}),
            }),
          )
        : [
            ...guild.chatSessions.map((s) => chatSessionContract.parse({ ...s, active: false })),
            chatSessionContract.parse({
              sessionId,
              agentRole: 'chaoswhisperer',
              startedAt: new Date().toISOString(),
              active: true,
            }),
          ];
    await orchestratorUpdateGuildAdapter({
      guildId: guildIdParsed,
      chatSessions: updatedSessions,
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
