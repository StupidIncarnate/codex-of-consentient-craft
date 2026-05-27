/**
 * PURPOSE: Layer helper for questGetNextStepBroker — loads quests across all valid guilds and filters to those that are post-Start-Quest (actively executing). Catches per-guild failures so one broken guild doesn't blank the whole scan.
 *
 * USAGE:
 * const quests = await loadActiveQuestsLayerBroker();
 * // Returns: Quest[] — flattened list of in_progress quests from every valid guild.
 */

import type { Quest } from '@dungeonmaster/shared/contracts';
import { isActivelyExecutingQuestStatusGuard } from '@dungeonmaster/shared/guards';

import { guildListBroker } from '../../guild/list/guild-list-broker';
import { questListBroker } from '../list/quest-list-broker';

export const loadActiveQuestsLayerBroker = async (): Promise<Quest[]> => {
  const guilds = await guildListBroker();
  const perGuildQuests = await Promise.all(
    guilds
      .filter((g) => g.valid)
      .map(async (g) => {
        try {
          const quests = await questListBroker({ guildId: g.id });
          return quests.filter((q) => isActivelyExecutingQuestStatusGuard({ status: q.status }));
        } catch {
          return [] as Quest[];
        }
      }),
  );
  return perGuildQuests.flat();
};
