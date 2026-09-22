/**
 * PURPOSE: The `prune` call's own entry — parses argv into a `PruneArgs` and hands it straight to
 * `SiegelensePruneResponder`. `prune` starts nothing and needs no branching beyond that
 * (`siegelense-prune-responder.ts`'s own header), so this layer composes exactly the two steps the
 * call requires: parse, then respond. `siegelense-flow.ts` routes `prune` here.
 *
 * USAGE:
 * await SiegelensePruneLayerFlow({ callArgs: ['--kind', 'shot', '--older-than', '0s'] });
 * // Deletes every shot past the window and returns the AdapterResult SiegelensePruneResponder
 * // resolves to
 */

import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import { SiegelensePruneResponder } from '../../responders/siegelense/prune/siegelense-prune-responder';
import { pruneArgsParseTransformer } from '../../transformers/prune-args-parse/prune-args-parse-transformer';

export const SiegelensePruneLayerFlow = async ({
  callArgs,
}: {
  callArgs: readonly string[];
}): Promise<AdapterResult> =>
  SiegelensePruneResponder(pruneArgsParseTransformer({ args: callArgs }));
