/**
 * PURPOSE: Deletes a quest by sending a DELETE request to the per-quest API endpoint with the guildId query parameter
 *
 * USAGE:
 * await questDeleteBroker({questId, guildId});
 * // Returns {deleted: true} on success, throws on failure
 */

import type { GuildId, QuestId } from '@dungeonmaster/shared/contracts';

import { fetchDeleteAdapter } from '../../../adapters/fetch/delete/fetch-delete-adapter';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const questDeleteBroker = async ({
  questId,
  guildId,
}: {
  questId: QuestId;
  guildId: GuildId;
}): Promise<{ deleted: boolean }> => {
  const url = `${webConfigStatics.api.routes.questById.replace(
    ':questId',
    questId,
  )}?guildId=${encodeURIComponent(guildId)}`;

  return fetchDeleteAdapter<{ deleted: boolean }>({ url });
};
