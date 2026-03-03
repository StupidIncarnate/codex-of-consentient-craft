/**
 * PURPOSE: Adapter for questOutboxWatchBroker that wraps the orchestrator package
 *
 * USAGE:
 * const { stop } = await orchestratorOutboxWatchAdapter({
 *   onQuestChanged: ({ questId }) => handleChange({ questId }),
 *   onError: ({ error }) => handleError({ error }),
 * });
 * // later: stop();
 */

import { questOutboxWatchBroker } from '@dungeonmaster/orchestrator';
import type { QuestId } from '@dungeonmaster/shared/contracts';

export const orchestratorOutboxWatchAdapter = async ({
  onQuestChanged,
  onError,
}: {
  onQuestChanged: (args: { questId: QuestId }) => void;
  onError: (args: { error: unknown }) => void;
}): Promise<{ stop: () => void }> => {
  const result = await questOutboxWatchBroker({ onQuestChanged, onError });
  return result;
};
