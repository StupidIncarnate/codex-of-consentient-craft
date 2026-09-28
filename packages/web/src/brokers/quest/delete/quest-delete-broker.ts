/**
 * PURPOSE: Deletes a quest by sending a DELETE request to the per-quest API endpoint with the guildId query parameter
 *
 * USAGE:
 * await questDeleteBroker({questId, guildId});
 * // Returns {deleted: true} on success, throws on failure
 */

import type { GuildId, QuestId } from '@dungeonmaster/shared/contracts';

import { fetchJson } from '#gateway/browser/fetch';

import { questDeleteResultContract } from '../../../contracts/quest-delete-result/quest-delete-result-contract';
import type { QuestDeleteResult } from '../../../contracts/quest-delete-result/quest-delete-result-contract';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const questDeleteBroker = async ({
  questId,
  guildId,
}: {
  questId: QuestId;
  guildId: GuildId;
}): Promise<QuestDeleteResult> => {
  const url = `${webConfigStatics.api.routes.questById.replace(
    ':questId',
    questId,
  )}?guildId=${encodeURIComponent(guildId)}`;

  const response = await fetchJson({ url, method: 'DELETE' });
  return questDeleteResultContract.parse(response);
};
