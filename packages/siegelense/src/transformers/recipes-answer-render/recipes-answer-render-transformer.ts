/**
 * PURPOSE: Renders a `RecipesAnswer` into the block a person reads at a terminal — one entry per
 * recipe, each carrying the two things a session picks on (`produces:` and `fidelity`) plus the
 * three that tell it how to CALL the recipe (`mirrors:`, what it takes, what it returns). The
 * fidelity line carries the risk that marker declares rather than the bare word, because the marker
 * exists to warn and a reader who has to look up what `direct` costs has been handed a label instead
 * of a warning.
 *
 * `mirrors:` and `takes:` are omitted where they are empty rather than printed as `-`: a recipe with
 * no parameters is the composable base case, and a blank row invites a reader to wonder what it
 * should have said. Reach for this only behind `--human`; the JSON answer is the default every
 * scripted caller reads, and this text is not parseable back.
 *
 * Pure, so the listing is provable without stdout — the same split `statusAnswerRenderTransformer`
 * already uses.
 *
 * USAGE:
 * recipesAnswerRenderTransformer({ answer: RecipesAnswerStub({ recipes: [] }) });
 * // Returns the "no recipes yet" sentence
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';
import { recipeFidelityStatics } from '@dungeonmaster/siegelense-recipes/statics';

import type { RecipesAnswer } from '../../contracts/recipes-answer/recipes-answer-contract';
import { recipeLocationStatics } from '../../statics/recipe-location/recipe-location-statics';

const EMPTY_MESSAGE = `No recipes yet — ${recipeLocationStatics.packageDir.relative}/ holds none. Adding one lists it here.\n`;

export const recipesAnswerRenderTransformer = ({
  answer,
}: {
  answer: RecipesAnswer;
}): ContentText => {
  if (answer.recipes.length === 0) {
    return contentTextContract.parse(EMPTY_MESSAGE);
  }

  const blocks = answer.recipes.map((recipe) => {
    const parameterText = recipe.parameters
      .map((parameter) => `${parameter.name} (${parameter.required ? 'required' : 'optional'})`)
      .join(', ');
    const returnText = recipe.returns.map((returned) => returned.name).join(', ');

    return [
      recipe.name,
      `  produces: ${recipe.produces}`,
      `  fidelity: ${recipe.fidelity} — ${recipeFidelityStatics.risks[recipe.fidelity]}`,
      ...(recipe.mirrors === null ? [] : [`  mirrors:  ${recipe.mirrors}`]),
      ...(parameterText === '' ? [] : [`  takes:    ${parameterText}`]),
      ...(returnText === '' ? [] : [`  returns:  ${returnText}`]),
    ].join('\n');
  });

  return contentTextContract.parse(`${blocks.join('\n\n')}\n`);
};
