/**
 * PURPOSE: Finds which quest carries an operation item with a given id, by scanning every
 * registered guild's quest list and fetching each quest's FULL record. Reach for this from
 * `update`/`remove`: both routes are handed only `{ target, record }` — `operationItemContract`
 * carries no back-reference to its quest — so the owning quest has to be found rather than read
 * off the row, the same shape `questOwningGuildFindBroker` already carries for the identical
 * reason. `StartOrchestrator.listQuests` alone cannot answer this: `QuestListItem` is "a
 * simplified quest structure for display in list views" and carries no `operations` array, so
 * each candidate's full record is fetched through `StartOrchestrator.getQuest` before its ledger
 * can be checked.
 *
 * USAGE:
 * await operationOwningQuestFindBroker({ operationItemId });
 * // Returns the Quest whose operations[] contains that id; throws if none does
 */
import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { OperationItemId, Quest } from '@dungeonmaster/shared/contracts';

export const operationOwningQuestFindBroker = async ({
  operationItemId,
}: {
  operationItemId: OperationItemId;
}): Promise<Quest> => {
  const guilds = await StartOrchestrator.listGuilds();

  const questListsByGuild = await Promise.all(
    guilds.map(async (guild) => StartOrchestrator.listQuests({ guildId: guild.id })),
  );
  const questIds = questListsByGuild.flat().map((questListItem) => questListItem.id);

  const fullQuests = await Promise.all(
    questIds.map(async (questId) => StartOrchestrator.getQuest({ questId })),
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
