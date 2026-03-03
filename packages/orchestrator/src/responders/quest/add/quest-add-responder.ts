/**
 * PURPOSE: Adds a new quest via questAddBroker
 *
 * USAGE:
 * const result = await QuestAddResponder({ title: 'Add Auth', userRequest: 'User wants...', guildId });
 * // Returns AddQuestResult with success status and quest details
 */

import type { GuildId } from '@dungeonmaster/shared/contracts';

import { questAddBroker } from '../../../brokers/quest/add/quest-add-broker';
import { addQuestInputContract } from '../../../contracts/add-quest-input/add-quest-input-contract';
import type { AddQuestResult } from '../../../contracts/add-quest-result/add-quest-result-contract';

export const QuestAddResponder = async ({
  title,
  userRequest,
  guildId,
}: {
  title: string;
  userRequest: string;
  guildId: GuildId;
}): Promise<AddQuestResult> => {
  const input = addQuestInputContract.parse({ title, userRequest });
  const result = await questAddBroker({ input, guildId });

  return result;
};
