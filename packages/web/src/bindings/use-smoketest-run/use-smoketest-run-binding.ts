/**
 * PURPOSE: React hook that posts a smoketest suite kickoff and returns the first enqueued entry so the caller can navigate to its session view
 *
 * USAGE:
 * const { run } = useSmoketestRunBinding();
 * const first = await run({ suite: 'mcp' });
 * // first is { questId, guildSlug } of the first enqueued quest, or null when the backend enqueued nothing
 */

import { useCallback } from 'react';

import type { QuestId, SmoketestSuite, UrlSlug } from '@dungeonmaster/shared/contracts';

import { toolingRunSmoketestBroker } from '../../brokers/tooling/run-smoketest/tooling-run-smoketest-broker';

export const useSmoketestRunBinding = (): {
  run: (params: {
    suite: SmoketestSuite;
  }) => Promise<{ questId: QuestId; guildSlug: UrlSlug } | null>;
} => {
  const run = useCallback(
    async ({
      suite,
    }: {
      suite: SmoketestSuite;
    }): Promise<{ questId: QuestId; guildSlug: UrlSlug } | null> => {
      try {
        const { enqueued } = await toolingRunSmoketestBroker({ suite });
        return enqueued[0] ?? null;
      } catch (error: unknown) {
        globalThis.console.error('[use-smoketest-run]', error);
        return null;
      }
    },
    [],
  );

  return { run };
};
