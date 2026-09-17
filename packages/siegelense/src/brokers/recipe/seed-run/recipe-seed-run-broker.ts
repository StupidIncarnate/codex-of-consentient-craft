/**
 * PURPOSE: The one place a recipe NAME becomes state on a lane — resolve, grade the parameters,
 * run it, and check what came back against what the manifest promised. Both callers reach a recipe
 * through here: the `seed` STEP inside a batch, and `start --seed` at boot. Reach for this over
 * `recipeRunBroker` directly; that one executes and knows nothing about the book.
 *
 * Four things happen, in this order, and each is a refusal a caller can act on:
 *
 * 1. **Resolve through `recipeBookReadBroker`** — the same call `dungeonmaster siegelense recipes`
 *    makes. That is what keeps "the listing and the runner read the same declaration"
 *    (siegelense-recipes.md line 713) true by construction rather than by convention. An unknown
 *    name throws `RecipeUnknownError` carrying the whole book.
 * 2. **Grade the parameters against the manifest.** The `seed` member of `stepContract` is the one
 *    member that is not `.strict()`, because parameters ride the step as top-level keys — so a
 *    missing required one or a misspelled key is caught HERE, by name, against the only thing that
 *    knows what a given recipe takes.
 * 3. **Run it**, through the recipes package's own dispatch.
 * 4. **Check the returned keys against the manifest's declared `returns`.** A recipe that made
 *    something it never declared is a state no walk can address, and one that declared something
 *    it never made is a `{g.questId}` that resolves to nothing three steps later. Both are the
 *    build-time `satisfies` siegelense-recipes.md line 505 asks for, enforced at the one moment
 *    both halves are in hand.
 *
 * USAGE:
 * await recipeSeedRunBroker({ recipe, apiBaseUrl, homePath, parameters: { guild: '7306…' } });
 * // Returns the ids the recipe made, already graded against what it declared
 */

import type { AbsoluteFilePath, ContentText } from '@dungeonmaster/shared/contracts';
import { recipeRunBroker } from '@dungeonmaster/siegelense-recipes/brokers';
import { recipeContextContract } from '@dungeonmaster/siegelense-recipes/contracts';
import type { RecipeName, RecipeResult } from '@dungeonmaster/siegelense-recipes/contracts';

import { RecipeParametersInvalidError } from '../../../errors/recipe-parameters-invalid/recipe-parameters-invalid-error';
import { RecipeReturnsMismatchError } from '../../../errors/recipe-returns-mismatch/recipe-returns-mismatch-error';
import { RecipeUnknownError } from '../../../errors/recipe-unknown/recipe-unknown-error';
import { recipeBookReadBroker } from '../book-read/recipe-book-read-broker';

export const recipeSeedRunBroker = async ({
  recipe,
  apiBaseUrl,
  homePath,
  parameters,
}: {
  recipe: RecipeName;
  apiBaseUrl: ContentText;
  homePath: AbsoluteFilePath;
  parameters: Record<string, ContentText>;
}): Promise<RecipeResult> => {
  const book = await recipeBookReadBroker();
  const manifest = book.recipes.find((candidate) => candidate.name === recipe);
  if (manifest === undefined) {
    throw new RecipeUnknownError({
      name: recipe,
      known: book.recipes.map((candidate) => candidate.name),
    });
  }

  const declared = manifest.parameters.map((parameter) => parameter.name);
  const required = manifest.parameters
    .filter((parameter) => parameter.required)
    .map((parameter) => parameter.name);
  const supplied = Object.keys(parameters);
  const missing = required.filter((name) => !supplied.includes(name));
  const unknown = supplied.filter(
    (name) => !declared.some((declaredName) => declaredName === name),
  );

  if (missing.length > 0 || unknown.length > 0) {
    throw new RecipeParametersInvalidError({ name: recipe, missing, unknown, declared });
  }

  const result = await recipeRunBroker({
    name: recipe,
    context: recipeContextContract.parse({ apiBaseUrl, homePath }),
    parameters,
  });

  const promised = manifest.returns.map((entry) => entry.name);
  const produced = Object.keys(result);
  const undeclared = produced.filter(
    (name) => !promised.some((promisedName) => promisedName === name),
  );
  const unfulfilled = promised.filter(
    (name) => !produced.some((producedName) => producedName === name),
  );

  if (undeclared.length > 0 || unfulfilled.length > 0) {
    throw new RecipeReturnsMismatchError({
      name: recipe,
      undeclared,
      unfulfilled,
      declared: promised,
    });
  }

  return result;
};
