/**
 * PURPOSE: Renders a `RecipesAnswer` into the text an operator reads at a terminal — one block per
 * recipe naming what it needs, whether it needs a live server, and what it makes, in the field order
 * the `recipes {}` example in `siegelense-recipes.md`'s "The calls this document uses" section
 * prints (`inputs:`, `runs:`, `makes:`). `runs` is the line that stops a wasted run: a caller with no
 * server reads `needs a server: <ingredient>` and stops there, instead of finding out partway through
 * with half a plan on disk (same section — "`runs` is the line that stops a wasted run"). Pure, so
 * this text is provable without stdout, the same split `cleanupAnswerRenderTransformer` already uses.
 *
 * USAGE:
 * recipesAnswerRenderTransformer({ answer: RecipesAnswerStub({ recipes: [] }) });
 * // Returns 'no recipes declared yet\n'
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

import type { RecipesAnswer } from '../../contracts/recipes-answer/recipes-answer-contract';

const NO_RECIPES = 'no recipes declared yet\n';
// Every label plus its trailing padding fills this width, so `inputs:`, `runs:` and `makes:` line up
// their values in one column — the alignment siegelense-recipes.md's own listing example shows.
const LABEL_WIDTH = 9;

export const recipesAnswerRenderTransformer = ({
  answer,
}: {
  answer: RecipesAnswer;
}): ContentText => {
  if (answer.recipes.length === 0) {
    return contentTextContract.parse(NO_RECIPES);
  }

  const blocks = answer.recipes.map((entry) => {
    const inputsText = entry.inputKeys.length === 0 ? 'none' : entry.inputKeys.join(', ');
    const runsText = entry.runs.serverless
      ? 'serverless'
      : `needs a server: ${entry.runs.needsServerFor}`;
    const makesText = entry.makes
      .map((made) =>
        made.count === 'varies'
          ? `${made.ingredient} (varies)`
          : `${made.ingredient} ×${made.count}`,
      )
      .join(', ');

    return [
      `  ${entry.recipeName}`,
      `    ${entry.description}`,
      `    ${'inputs:'.padEnd(LABEL_WIDTH)}${inputsText}`,
      `    ${'runs:'.padEnd(LABEL_WIDTH)}${runsText}`,
      `    ${'makes:'.padEnd(LABEL_WIDTH)}${makesText}`,
    ].join('\n');
  });

  return contentTextContract.parse(`${blocks.join('\n\n')}\n`);
};
