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
  resetOnStart,
}: {
  onQuestChanged: (args: { questId: QuestId }) => void;
  onError: (args: { error: unknown }) => void;
  // Forwarded verbatim; the broker's own parameter comment names the one caller allowed to set it.
  resetOnStart?: boolean;
}): Promise<{ stop: () => void }> => {
  const result = await questOutboxWatchBroker({
    onQuestChanged,
    onError,
    ...(resetOnStart === undefined ? {} : { resetOnStart }),
  });
  return result;
};
