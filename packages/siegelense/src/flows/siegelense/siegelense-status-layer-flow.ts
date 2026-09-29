/**
 * PURPOSE: The `status` call's own entry — parses argv into a `StatusArgs` and hands it straight to
 * `SiegelenseStatusResponder`. `status` starts nothing and needs no branching beyond that
 * (`siegelense-status-responder.ts`'s own header), so this layer composes exactly the two steps the
 * call requires: parse, then respond. `siegelense-flow.ts` routes `status` here.
 *
 * USAGE:
 * await SiegelenseStatusLayerFlow({ callArgs: ['--instance', 'inst_7f3a9c21'] });
 * // Parses the argv into StatusArgs and hands them to SiegelenseStatusResponder
 * // and resolves with nothing
 */

import { SiegelenseStatusResponder } from '../../responders/siegelense/status/siegelense-status-responder';
import { statusArgsParseTransformer } from '../../transformers/status-args-parse/status-args-parse-transformer';

export const SiegelenseStatusLayerFlow = async ({
  callArgs,
}: {
  callArgs: readonly string[];
}): Promise<void> => SiegelenseStatusResponder(statusArgsParseTransformer({ args: callArgs }));
