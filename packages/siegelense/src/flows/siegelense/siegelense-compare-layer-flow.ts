/**
 * PURPOSE: The `compare` call's own entry — parses argv into a `CompareArgs` and hands that SAME
 * parsed object to `SiegelenseCompareResponder` twice: once as `query` (the `instanceId`/`runA`/
 * `runB` triple `compareReadBroker` destructures off it, ignoring the extra `isJson` field) and once
 * as `isJson`, so `compareArgsParseTransformer`'s one parse serves both parameters rather than being
 * read apart into two objects. `siegelense-flow.ts` routes `compare` here.
 *
 * USAGE:
 * await SiegelenseCompareLayerFlow({
 *   callArgs: ['--instance', 'inst_7f3a9c21', '--run-a', 'run_4', '--run-b', 'run_5'],
 * });
 * // Parses the argv into CompareArgs and returns the AdapterResult SiegelenseCompareResponder
 * // resolves to
 */

import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import { SiegelenseCompareResponder } from '../../responders/siegelense/compare/siegelense-compare-responder';
import { compareArgsParseTransformer } from '../../transformers/compare-args-parse/compare-args-parse-transformer';

export const SiegelenseCompareLayerFlow = async ({
  callArgs,
}: {
  callArgs: readonly string[];
}): Promise<AdapterResult> => {
  const parsed = compareArgsParseTransformer({ args: callArgs });
  return SiegelenseCompareResponder({ query: parsed, isJson: parsed.isJson });
};
