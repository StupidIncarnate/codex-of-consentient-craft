/**
 * PURPOSE: The surface `dungeonmaster siegelense recipes [--json]` serves — the reading block
 * through `recipesAnswerRenderTransformer` by default (when `human` is true or omitted), or one
 * JSON document on stdout (the raw `RecipesAnswer`) when `human` is false (opted into with
 * `--json`). Writes through `process.stdout.write`, never `console.log`, matching every other
 * siegelense call.
 *
 * It starts nothing and holds no pool slot: the listing is the answer to "what states can be
 * created", asked before anything has been seeded, so booting an instance to answer it would be the
 * cost the whole design routes around. The absent-package case is `recipeBookReadBroker`'s own
 * throw, not a branch here — this responder has exactly one answer shape, and that is what keeps
 * "no recipes yet" from ever sharing a rendering with "siegelense was never installed here".
 *
 * `human` defaults to `true` in the destructuring.
 *
 * USAGE:
 * await SiegelenseRecipesResponder();
 * // Writes one block per recipe — produces:, fidelity, mirrors:, what it takes and returns
 *
 * await SiegelenseRecipesResponder({ human: false });
 * // Writes the RecipesAnswer as one JSON document
 */

import { adapterResultContract } from '@dungeonmaster/shared/contracts';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import { recipeBookReadBroker } from '../../../brokers/recipe/book-read/recipe-book-read-broker';
import { siegelenseOutputStatics } from '../../../statics/siegelense-output/siegelense-output-statics';
import { recipesAnswerRenderTransformer } from '../../../transformers/recipes-answer-render/recipes-answer-render-transformer';

export const SiegelenseRecipesResponder = async (
  {
    human = true,
  }: {
    human?: boolean;
  } = { human: true },
): Promise<AdapterResult> => {
  const answer = await recipeBookReadBroker();

  process.stdout.write(
    human
      ? recipesAnswerRenderTransformer({ answer })
      : `${JSON.stringify(answer, null, siegelenseOutputStatics.json.indentSpaces)}\n`,
  );

  return adapterResultContract.parse({ success: true });
};
