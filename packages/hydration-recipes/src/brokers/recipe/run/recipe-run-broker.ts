/**
 * PURPOSE: The ONE entry point `@dungeonmaster/siegelense` calls to execute a recipe — name in,
 * ids out. It exists so the package that owns the recipes also owns which name reaches which
 * broker: a `seed` step names a recipe and nothing else, so a dispatch table living in the tool
 * would be a second place a recipe's name is written, and the two would drift.
 *
 * Each recipe takes exactly the parameters its manifest declares, resolved HERE from the named
 * parameter map rather than passed to every recipe uniformly — "a recipe takes its dependencies
 * EXPLICITLY" (siegelense-recipes.md line 281) is a statement about the recipe's own signature,
 * and a uniform bag would let a recipe read a parameter it never declared. Whether a parameter is
 * present at all is already settled upstream by `recipeSeedRunBroker`, which grades the caller's
 * keys against the manifest and refuses a missing or unknown one BY NAME; this broker only has to
 * hand the values over.
 *
 * USAGE:
 * await recipeRunBroker({ name: 'guild-with-three-quests', context, parameters: {} });
 * // Returns the RecipeResult that recipe's manifest declares
 */

import { contentTextContract, guildIdContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

import type { RecipeContext } from '../../../contracts/recipe-context/recipe-context-contract';
import type { RecipeName } from '../../../contracts/recipe-name/recipe-name-contract';
import type { RecipeResult } from '../../../contracts/recipe-result/recipe-result-contract';
import { recipeBookStatics } from '../../../statics/recipe-book/recipe-book-statics';
import { recipesGuildWithThreeQuestsBroker } from '../../recipes/guild-with-three-quests/recipes-guild-with-three-quests-broker';
import { recipesSessionWithNestedSubagentBroker } from '../../recipes/session-with-nested-subagent/recipes-session-with-nested-subagent-broker';

export const recipeRunBroker = async ({
  name,
  context,
  parameters,
}: {
  name: RecipeName;
  context: RecipeContext;
  parameters: Record<string, ContentText>;
}): Promise<RecipeResult> => {
  if (name === recipeBookStatics.names.guildWithThreeQuests) {
    return recipesGuildWithThreeQuestsBroker({ context });
  }

  if (name === recipeBookStatics.names.sessionWithNestedSubagent) {
    return recipesSessionWithNestedSubagentBroker({
      context,
      guild: guildIdContract.parse(contentTextContract.parse(parameters.guild)),
    });
  }

  throw new Error(
    `recipeRunBroker: "${name}" is declared in the book but no broker routes it. Every entry in recipeBookStatics needs a case here — a listing that promises a state nothing can create is the gap this dispatch exists to close. Routed: ${Object.values(recipeBookStatics.names).join(', ')}`,
  );
};
