/**
 * PURPOSE: The surface `dungeonmaster siegelense recipes [--human]` serves — one JSON document on
 * stdout by default (the raw `RecipesAnswer`), or the reading block through
 * `recipesAnswerRenderTransformer` when `human` is true. Writes through `process.stdout.write`,
 * never `console.log`, matching every other siegelense call.
 *
 * It starts nothing and holds no pool slot: the listing is the answer to "what states can be
 * created", asked before anything has been seeded, so booting an instance to answer it would be the
 * cost the whole design routes around. The absent-package case is `recipeBookReadBroker`'s own
 * throw, not a branch here — this responder has exactly one answer shape, and that is what keeps
 * "no recipes yet" from ever sharing a rendering with "siegelense was never installed here".
 *
 * `human` is required rather than defaulted, unlike `SiegelenseStatusResponder`'s: that call's
 * default exists for a route table that predates its flag, and this one has no such caller.
 *
 * USAGE:
 * await SiegelenseRecipesResponder({ human: false });
 * // Writes the RecipesAnswer as one JSON document
 *
 * await SiegelenseRecipesResponder({ human: true });
 * // Writes one block per recipe — produces:, fidelity, mirrors:, what it takes and returns
 */

import { adapterResultContract } from '@dungeonmaster/shared/contracts';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import { recipeBookReadBroker } from '../../../brokers/recipe/book-read/recipe-book-read-broker';
import { siegelenseOutputStatics } from '../../../statics/siegelense-output/siegelense-output-statics';
import { recipesAnswerRenderTransformer } from '../../../transformers/recipes-answer-render/recipes-answer-render-transformer';

export const SiegelenseRecipesResponder = async ({
  human,
}: {
  human: boolean;
}): Promise<AdapterResult> => {
  const answer = await recipeBookReadBroker();

  process.stdout.write(
    human
      ? recipesAnswerRenderTransformer({ answer })
      : `${JSON.stringify(answer, null, siegelenseOutputStatics.json.indentSpaces)}\n`,
  );

  return adapterResultContract.parse({ success: true });
};
