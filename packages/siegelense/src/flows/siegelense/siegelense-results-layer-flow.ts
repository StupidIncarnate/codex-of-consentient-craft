/**
 * PURPOSE: The `results` call's own entry — parses argv into a `ResultsArgs` and hands the query
 * straight to `SiegelenseResultsResponder`, splitting `isJson` off the rest with the same destructure
 * `siegelense-flow.ts`'s `CALL_ROUTES` map used before this call was lifted out of it: `isJson` is not
 * a `ResultsQuery` member, and `resultsQueryContract` is `.strict()`, so passing the whole
 * `ResultsArgs` object through unsplit would throw on the stray key. `results` reads evidence
 * already on disk and starts nothing (`siegelense-results-responder.ts`'s own header), so this layer
 * needs no branching beyond that one destructure. `siegelense-flow.ts` routes `results` here.
 *
 * USAGE:
 * await SiegelenseResultsLayerFlow({
 *   callArgs: ['--instance', 'inst_7f3a9c21', '--run', 'run_2', '--kind', 'console'],
 * });
 * // Parses the argv into a ResultsQuery and returns the AdapterResult SiegelenseResultsResponder
 * // resolves to
 */

import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import { SiegelenseResultsResponder } from '../../responders/siegelense/results/siegelense-results-responder';
import { resultsArgsParseTransformer } from '../../transformers/results-args-parse/results-args-parse-transformer';

export const SiegelenseResultsLayerFlow = async ({
  callArgs,
}: {
  callArgs: readonly string[];
}): Promise<AdapterResult> => {
  const { isJson, ...query } = resultsArgsParseTransformer({ args: callArgs });
  return SiegelenseResultsResponder({ query, isJson });
};
