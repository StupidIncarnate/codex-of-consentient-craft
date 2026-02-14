/**
 * PURPOSE: Fetches chat history entries for a quest session from the API
 *
 * USAGE:
 * const entries = await questChatHistoryBroker({questId, sessionId});
 * // Returns raw JSONL entries array (unknown[])
 */
import type { QuestId, SessionId } from '@dungeonmaster/shared/contracts';

import { fetchGetAdapter } from '../../../adapters/fetch/get/fetch-get-adapter';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const questChatHistoryBroker = async ({
  questId,
  sessionId,
}: {
  questId: QuestId;
  sessionId: SessionId;
}): Promise<unknown[]> => {
  const basePath = webConfigStatics.api.routes.questChatHistory.replace(':questId', questId);
  const url = `${basePath}?sessionId=${encodeURIComponent(sessionId)}`;

  return fetchGetAdapter<unknown[]>({ url });
};
