/**
 * PURPOSE: The `capacity` call's own entry — parses argv into a `CapacityArgs` and hands it straight
 * to `SiegelenseCapacityResponder`. `capacity` starts nothing and needs no branching beyond that
 * (`siegelense-capacity-responder.ts`'s own header), so this layer composes exactly the two steps the
 * call requires: parse, then respond. `siegelense-flow.ts` routes `capacity` here.
 *
 * USAGE:
 * await SiegelenseCapacityLayerFlow({ callArgs: ['--spec', 'dungeonmaster-stack'] });
 * // Parses the argv into CapacityArgs and hands them to SiegelenseCapacityResponder
 * // and resolves with nothing
 */

import { SiegelenseCapacityResponder } from '../../responders/siegelense/capacity/siegelense-capacity-responder';
import { capacityArgsParseTransformer } from '../../transformers/capacity-args-parse/capacity-args-parse-transformer';

export const SiegelenseCapacityLayerFlow = async ({
  callArgs,
}: {
  callArgs: readonly string[];
}): Promise<void> => SiegelenseCapacityResponder(capacityArgsParseTransformer({ args: callArgs }));
