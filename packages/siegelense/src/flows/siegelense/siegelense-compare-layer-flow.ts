/**
 * PURPOSE: The `compare` call's own entry — parses argv into a `CompareArgs` and hands that SAME
 * parsed object's `instanceId`/`runA`/`runB` triple through `compareQueryContract` (the strict
 * shape `compareReadBroker` reads, which refuses the extra `isJson` key) and hands it to
 * `SiegelenseCompareResponder` as `query`, with `isJson` beside it. `siegelense-flow.ts` routes
 * `compare` here.
 *
 * USAGE:
 * await SiegelenseCompareLayerFlow({
 *   callArgs: ['--instance', 'inst_7f3a9c21', '--run-a', 'run_4', '--run-b', 'run_5'],
 * });
 * // Parses the argv into CompareArgs and hands them to SiegelenseCompareResponder
 * // and resolves with nothing
 */

import { SiegelenseCompareResponder } from '../../responders/siegelense/compare/siegelense-compare-responder';
import { compareQueryContract } from '../../contracts/compare-query/compare-query-contract';
import { compareArgsParseTransformer } from '../../transformers/compare-args-parse/compare-args-parse-transformer';

export const SiegelenseCompareLayerFlow = async ({
  callArgs,
}: {
  callArgs: readonly string[];
}): Promise<void> => {
  const parsed = compareArgsParseTransformer({ args: callArgs });
  const query = compareQueryContract.parse({
    instanceId: parsed.instanceId,
    runA: parsed.runA,
    runB: parsed.runB,
  });
  return SiegelenseCompareResponder({ query, isJson: parsed.isJson });
};
