/**
 * PURPOSE: The quest ingredient's `remove` route — resolves which guild owns the quest via
 * `questOwningGuildFindBroker`, then deletes it through `StartOrchestrator.deleteQuest`. A
 * quest's parent is its FOLDER, not a field on the record (`questContract` carries no `guildId`
 * at all), and a `remove` route is handed only `{ target, record }` — no link value rides along
 * the way it does for `write` — so the owning guild has to be found rather than read off the row.
 *
 * USAGE:
 * await questRemoveRouteBroker({ target, record: quest });
 * // Removes the quest folder from disk and appends a quest-modified outbox event
 */
import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import { questIdContract } from '@dungeonmaster/shared/contracts';

import { questOwningGuildFindBroker } from '../owning-guild-find/quest-owning-guild-find-broker';
import type { DmTarget } from '../../../contracts/dm-target/dm-target-contract';

export const questRemoveRouteBroker = async ({
  record,
}: {
  target: DmTarget;
  record: Record<string, unknown>;
}): Promise<{ deleted: boolean }> => {
  const questId = questIdContract.parse(record.id);
  const guildId = await questOwningGuildFindBroker({ questId });

  return StartOrchestrator.deleteQuest({ questId, guildId });
};
