/**
 * PURPOSE: Finds which quest carries an operation item with a given id, by scanning every
 * registered guild's quest list and fetching each quest's FULL record. Reach for this from
 * `update`/`remove`: both routes are handed only `{ target, record }` — `operationItemContract`
 * carries no back-reference to its quest — so the owning quest has to be found rather than read
 * off the row, the same shape `questOwningGuildFindBroker` already carries for the identical
 * reason. `questListBroker` alone cannot answer this: it returns full `Quest[]`, but a quest
 * needs a fresh reload through `questGetBroker` before its ledger can be trusted, the same reload
 * `questUpdateRouteBroker` already relies on.
 *
 * Every broker below is imported BY PATH from the orchestrator's `/brokers` subpath rather than
 * through `StartOrchestrator` on the main barrel: importing anything from that barrel evaluates
 * `startup/start-orchestrator.ts`, which boots a rate-limits watcher and a stale-process watchdog
 * at module scope, and this package is a short-lived hydration tool, not the long-running server
 * those exist for.
 *
 * USAGE:
 * await operationOwningQuestFindBroker({ operationItemId });
 * // Returns the Quest whose operations[] contains that id; throws if none does
 */
import {
  guildListBroker,
  questGetBroker,
  questListBroker,
} from '@dungeonmaster/orchestrator/brokers';
import { getQuestInputContract } from '@dungeonmaster/shared/contracts';
import type { OperationItemId, Quest } from '@dungeonmaster/shared/contracts';

export const operationOwningQuestFindBroker = async ({
  operationItemId,
}: {
  operationItemId: OperationItemId;
}): Promise<Quest> => {
  const guilds = await guildListBroker();

  const questListsByGuild = await Promise.all(
    guilds.map(async (guild) => questListBroker({ guildId: guild.id })),
  );
  const questIds = questListsByGuild.flat().map((quest) => quest.id);

  const fullQuests = await Promise.all(
    questIds.map(async (questId) =>
      questGetBroker({ input: getQuestInputContract.parse({ questId }) }),
    ),
  );

  const owner = fullQuests.find(
    (result) =>
      result.success &&
      result.quest?.operations.some((operation) => operation.id === operationItemId) === true,
  );

  if (!owner?.quest) {
    throw new Error(`operationOwningQuestFindBroker: no quest owns operation ${operationItemId}`);
  }

  return owner.quest;
};
