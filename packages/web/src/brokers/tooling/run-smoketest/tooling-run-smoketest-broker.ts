/**
 * PURPOSE: POSTs /api/tooling/smoketest/run with the chosen suite and returns the enqueued quest records
 *
 * USAGE:
 * const { enqueued } = await toolingRunSmoketestBroker({ suite: 'mcp' });
 * // Returns { enqueued: [{ questId, guildSlug }, ...] }
 */

import { questIdContract, urlSlugContract } from '@dungeonmaster/shared/contracts';
import type { QuestId, SmoketestSuite, UrlSlug } from '@dungeonmaster/shared/contracts';

import { fetchPostAdapter } from '../../../adapters/fetch/post/fetch-post-adapter';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const toolingRunSmoketestBroker = async ({
  suite,
}: {
  suite: SmoketestSuite;
}): Promise<{ enqueued: readonly { questId: QuestId; guildSlug: UrlSlug }[] }> => {
  const response = await fetchPostAdapter<{
    enqueued: readonly { questId: unknown; guildSlug: unknown }[];
  }>({
    url: webConfigStatics.api.routes.toolingSmoketestRun,
    body: { suite },
  });

  const enqueued = response.enqueued.map((entry) => ({
    questId: questIdContract.parse(entry.questId),
    guildSlug: urlSlugContract.parse(entry.guildSlug),
  }));

  return { enqueued };
};
