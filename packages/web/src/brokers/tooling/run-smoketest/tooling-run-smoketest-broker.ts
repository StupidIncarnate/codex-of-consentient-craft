/**
 * PURPOSE: POSTs /api/tooling/smoketest/run with the chosen suite and returns the resulting run + case results
 *
 * USAGE:
 * const result = await toolingRunSmoketestBroker({ suite: 'mcp' });
 * // Returns { runId, results }
 */

import { smoketestRunIdContract } from '@dungeonmaster/shared/contracts';
import type {
  SmoketestCaseResult,
  SmoketestRunId,
  SmoketestSuite,
} from '@dungeonmaster/shared/contracts';

import { fetchPostAdapter } from '../../../adapters/fetch/post/fetch-post-adapter';
import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const toolingRunSmoketestBroker = async ({
  suite,
}: {
  suite: SmoketestSuite;
}): Promise<{ runId: SmoketestRunId; results: readonly SmoketestCaseResult[] }> => {
  const response = await fetchPostAdapter<{
    runId: unknown;
    results: readonly SmoketestCaseResult[];
  }>({
    url: webConfigStatics.api.routes.toolingSmoketestRun,
    body: { suite },
  });

  return {
    runId: smoketestRunIdContract.parse(response.runId),
    results: response.results,
  };
};
