/**
 * PURPOSE: The `recipes` call's own entry — parses argv into a `RecipesArgs` and hands it straight
 * to `SiegelenseRecipesResponder`. `recipes` lists what states CAN be created rather than reporting
 * on a running instance, so it needs no branching beyond parse-then-respond
 * (`siegelense-recipes-responder.ts`'s own header) and no `--instance` — `recipesArgsParseTransformer`
 * refuses both `--instance` and any bare positional argument, since a catalogue has nothing to
 * narrow by. `siegelense-flow.ts` routes `recipes` here.
 *
 * USAGE:
 * await SiegelenseRecipesLayerFlow({ callArgs: ['--json'] });
 * // Parses the argv into RecipesArgs and returns the AdapterResult SiegelenseRecipesResponder
 * // resolves to
 */

import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import { SiegelenseRecipesResponder } from '../../responders/siegelense/recipes/siegelense-recipes-responder';
import { recipesArgsParseTransformer } from '../../transformers/recipes-args-parse/recipes-args-parse-transformer';

export const SiegelenseRecipesLayerFlow = async ({
  callArgs,
}: {
  callArgs: readonly string[];
}): Promise<AdapterResult> =>
  SiegelenseRecipesResponder(recipesArgsParseTransformer({ args: callArgs }));
