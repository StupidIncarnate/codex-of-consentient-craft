/**
 * PURPOSE: Bulk-deletes every quest in the smoketests guild whose questSource matches the given suite tag, so a smoketest suite run starts from a clean slate
 *
 * USAGE:
 * const { deletedCount } = await smoketestClearPriorQuestsBroker({ questSource: 'smoketest-mcp' });
 * // Returns: { deletedCount } — number of prior quests removed. Zero when no matches exist.
 *
 * WHEN-TO-USE: The smoketest-run responder before enqueueing a new suite run.
 * WHEN-NOT-TO-USE: Real user guilds. This broker only touches the smoketest guild.
 *
 * Idempotent. The underlying questDeleteBroker is the unconditional cleanup primitive (no status gate);
 * the status gate that refuses to delete actively-running quests lives at the responder level. Smoketest
 * runs are fire-and-forget test state, so clearing in-progress prior-run quests here is intentional.
 */

import type { QuestSource } from '@dungeonmaster/shared/contracts';

import { deletedCountContract } from '../../../contracts/deleted-count/deleted-count-contract';
import type { DeletedCount } from '../../../contracts/deleted-count/deleted-count-contract';
import { questDeleteBroker } from '../../quest/delete/quest-delete-broker';
import { questListBroker } from '../../quest/list/quest-list-broker';
import { smoketestEnsureGuildBroker } from '../ensure-guild/smoketest-ensure-guild-broker';

export const smoketestClearPriorQuestsBroker = async ({
  questSource,
}: {
  questSource: QuestSource;
}): Promise<{ deletedCount: DeletedCount }> => {
  const { guildId } = await smoketestEnsureGuildBroker();
  const quests = await questListBroker({ guildId });
  const matching = quests.filter((quest) => quest.questSource === questSource);

  await Promise.all(
    matching.map(async (quest) => questDeleteBroker({ questId: quest.id, guildId })),
  );

  return { deletedCount: deletedCountContract.parse(matching.length) };
};
