/**
 * PURPOSE: The surface `dungeonmaster siegelense recipes [--json] [--human]` serves — one JSON
 * document on stdout by default (the raw `RecipesAnswer`), or the per-recipe block
 * `recipesAnswerRenderTransformer` renders when `human` is true. Takes no `instanceId`: `recipes`
 * lists what states CAN be created, not what a running instance is doing (siegelense-recipes.md's
 * "The calls this document uses" section, "No instance needed"), so — unlike
 * `SiegelenseStatusResponder` — this responder never resolves or touches a live instance. Wraps
 * `recipesReadBroker`'s bare
 * `RecipesListing` in `recipesAnswerContract` before writing it, the same `{recipes: [...]}` shape
 * every other call's own `*-answer-contract` uses; an empty array is the plan's third state — "no
 * recipes declared yet" — and is a valid value here, not a refusal. `recipesReadBroker`'s own
 * refusals (`RecipesPackageMissingError`, `RecipesBuildMissingError`) propagate UNCHANGED, the same
 * decision `SiegelenseResultsResponder`'s header records for `RunIdRequiredError`: the CLI entry
 * point turns an uncaught throw into stderr text and exit 1, so this responder does not also catch
 * and re-format the message that is already the one an operator reads.
 *
 * USAGE:
 * await SiegelenseRecipesResponder({ human: false });
 * // Writes the RecipesAnswer as one JSON document
 *
 * await SiegelenseRecipesResponder({ human: true });
 * // Writes one block per recipe, or 'no recipes declared yet' when the listing is empty
 */

import { adapterResultContract } from '@dungeonmaster/shared/contracts';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import { recipesReadBroker } from '../../../brokers/recipes/read/recipes-read-broker';
import { recipesAnswerContract } from '../../../contracts/recipes-answer/recipes-answer-contract';
import { siegelenseOutputStatics } from '../../../statics/siegelense-output/siegelense-output-statics';
import { recipesAnswerRenderTransformer } from '../../../transformers/recipes-answer-render/recipes-answer-render-transformer';

export const SiegelenseRecipesResponder = async (
  {
    human,
  }: {
    human: boolean;
  } = { human: false },
): Promise<AdapterResult> => {
  const recipes = await recipesReadBroker();
  const answer = recipesAnswerContract.parse({ recipes });
  process.stdout.write(
    human
      ? recipesAnswerRenderTransformer({ answer })
      : `${JSON.stringify(answer, null, siegelenseOutputStatics.json.indentSpaces)}\n`,
  );
  return adapterResultContract.parse({ success: true });
};
