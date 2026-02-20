/**
 * PURPOSE: Resolves a guild session ID to its associated quest ID via the API
 *
 * USAGE:
 * const result = await guildSessionResolveBroker({guildId, sessionId});
 * // Returns {questId: QuestId | null}
 */
import type { GuildId, SessionId } from '@dungeonmaster/shared/contracts';

import { fetchGetAdapter } from '../../../adapters/fetch/get/fetch-get-adapter';
import type { SessionResolveResponse } from '../../../contracts/session-resolve-response/session-resolve-response-contract';
import { sessionResolveResponseContract } from '../../../contracts/session-resolve-response/session-resolve-response-contract';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const guildSessionResolveBroker = async ({
  guildId,
  sessionId,
}: {
  guildId: GuildId;
  sessionId: SessionId;
}): Promise<SessionResolveResponse> => {
  const response = await fetchGetAdapter<unknown>({
    url: webConfigStatics.api.routes.guildSessionResolve
      .replace(':guildId', guildId)
      .replace(':sessionId', sessionId),
  });

  return sessionResolveResponseContract.parse(response);
};
