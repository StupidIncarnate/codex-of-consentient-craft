/**
 * PURPOSE: Scans every registered guild for recoverable quests (not terminal, not paused, not pre-execution) and enqueues them on the cross-guild quest execution queue ordered by createdAt
 *
 * USAGE:
 * const { enqueuedCount } = await questEnqueueRecoverableBroker();
 * // Returns: { enqueuedCount } — zero when no guild has a recoverable quest.
 *
 * WHEN-TO-USE: Called by the execution-queue bootstrap responder on the first WS-connect (first flip of
 * web presence from false → true after process start). Gated behind `executionQueueBootstrapState.hasRecoveredOnce`
 * so server-restart-without-browser never kicks loops.
 * WHEN-NOT-TO-USE: Regular start-quest dispatch — that path enqueues via OrchestrationStartResponder.
 */

import { questQueueEntryContract } from '@dungeonmaster/shared/contracts';
import type { QuestQueueEntry } from '@dungeonmaster/shared/contracts';
import { isRecoverableQuestStatusGuard } from '@dungeonmaster/shared/guards';
import { nameToUrlSlugTransformer } from '@dungeonmaster/shared/transformers';

import { enqueuedCountContract } from '../../../contracts/enqueued-count/enqueued-count-contract';
import type { EnqueuedCount } from '../../../contracts/enqueued-count/enqueued-count-contract';
import { guildGetBroker } from '../../guild/get/guild-get-broker';
import { guildListBroker } from '../../guild/list/guild-list-broker';
import { questListBroker } from '../list/quest-list-broker';

export const questEnqueueRecoverableBroker = async ({
  enqueue,
  findProcessByQuestId,
}: {
  enqueue: (params: { entry: QuestQueueEntry }) => void;
  findProcessByQuestId: ({ questId }: { questId: QuestQueueEntry['questId'] }) => unknown;
}): Promise<{ enqueuedCount: EnqueuedCount }> => {
  const guilds = await guildListBroker();

  const perGuildRecoverable = await Promise.all(
    guilds
      .filter((guildItem) => guildItem.valid)
      .map(async (guildItem) => {
        try {
          const quests = await questListBroker({ guildId: guildItem.id });
          const guild = await guildGetBroker({ guildId: guildItem.id });
          const guildSlug = guild.urlSlug ?? nameToUrlSlugTransformer({ name: guild.name });
          return quests
            .filter((quest) => isRecoverableQuestStatusGuard({ status: quest.status }))
            .filter((quest) => findProcessByQuestId({ questId: quest.id }) === undefined)
            .map((quest) => ({ quest, guildId: guildItem.id, guildSlug }));
        } catch {
          return [];
        }
      }),
  );

  const all = perGuildRecoverable
    .flat()
    .slice()
    .sort((a, b) => a.quest.createdAt.localeCompare(b.quest.createdAt));

  for (const item of all) {
    const entry: QuestQueueEntry = questQueueEntryContract.parse({
      questId: item.quest.id,
      guildId: item.guildId,
      guildSlug: item.guildSlug,
      questTitle: item.quest.title,
      status: item.quest.status,
      enqueuedAt: new Date().toISOString(),
      ...(item.quest.questSource === undefined ? {} : { questSource: item.quest.questSource }),
    });
    enqueue({ entry });
  }

  return { enqueuedCount: enqueuedCountContract.parse(all.length) };
};
