/**
 * PURPOSE: Persists a new active chat session to a quest, deactivating all previous sessions
 *
 * USAGE:
 * questSessionPersistBroker({ questId: 'abc-123', sessionId: SessionIdStub() });
 * // Reads quest, deactivates existing sessions, appends new active session, writes back
 */

import { chatSessionContract, questContract } from '@dungeonmaster/shared/contracts';
import type { SessionId } from '@dungeonmaster/shared/contracts';

import { orchestratorGetQuestAdapter } from '../../../adapters/orchestrator/get-quest/orchestrator-get-quest-adapter';
import { orchestratorModifyQuestAdapter } from '../../../adapters/orchestrator/modify-quest/orchestrator-modify-quest-adapter';
import { processDevLogAdapter } from '../../../adapters/process/dev-log/process-dev-log-adapter';

export const questSessionPersistBroker = async ({
  questId,
  sessionId,
}: {
  questId: string;
  sessionId: SessionId;
}): Promise<void> => {
  try {
    const result = await orchestratorGetQuestAdapter({ questId });
    const questRaw: unknown = Reflect.get(result, 'quest');

    if (!questRaw) {
      processDevLogAdapter({
        message: `Failed to persist session: questId=${questId}, error=quest not found`,
      });
      return;
    }

    const quest = questContract.parse(questRaw);
    const deactivated = quest.chatSessions.map((s) =>
      chatSessionContract.parse({ ...s, active: false }),
    );
    const newSession = chatSessionContract.parse({
      sessionId,
      agentRole: 'chaoswhisperer',
      startedAt: new Date().toISOString(),
      active: true,
    });
    await orchestratorModifyQuestAdapter({
      questId,
      input: { questId, chatSessions: [...deactivated, newSession] } as never,
    });
    processDevLogAdapter({
      message: `Session persisted to quest: questId=${questId}, sessionId=${sessionId}`,
    });
  } catch (error: unknown) {
    processDevLogAdapter({
      message: `Failed to persist session: questId=${questId}, error=${error instanceof Error ? error.message : 'unknown'}`,
    });
  }
};
