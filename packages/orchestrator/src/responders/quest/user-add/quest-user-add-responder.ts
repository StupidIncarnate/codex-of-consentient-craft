/**
 * PURPOSE: Adds a new user-initiated quest via questUserAddBroker
 *
 * USAGE:
 * const result = await QuestUserAddResponder({ title: 'Add Auth', userRequest: 'User wants...', guildId });
 * // Returns AddQuestResult with success status and quest details
 */

import type { GuildId } from '@dungeonmaster/shared/contracts';

import { questUserAddBroker } from '../../../brokers/quest/user-add/quest-user-add-broker';
import { addQuestInputContract } from '@dungeonmaster/shared/contracts';
import type { AddQuestResult } from '@dungeonmaster/shared/contracts';

export const QuestUserAddResponder = async ({
  title,
  userRequest,
  guildId,
}: {
  title: string;
  userRequest: string;
  guildId: GuildId;
}): Promise<AddQuestResult> => {
  const input = addQuestInputContract.parse({ title, userRequest });
  const result = await questUserAddBroker({ input, guildId });

  return result;
};
