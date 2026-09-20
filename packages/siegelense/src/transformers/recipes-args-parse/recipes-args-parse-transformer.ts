/**
 * PURPOSE: Reads `dungeonmaster siegelense recipes`'s argv into a `RecipesArgs`. Every flag but
 * `--json` refuses — `recipes` needs no `--instance`, because it lists what states CAN
 * be created rather than reporting on one that is running (siegelense-recipes.md's "The calls this
 * document uses" section, "No instance needed") — carrying both that reason AND the canonical
 * positional-argument sentence its siblings all carry, so a stray positional argument states both why
 * nothing was expected and the general rule every other call states for the identical mistake.
 *
 * USAGE:
 * recipesArgsParseTransformer({ args: [] });
 * // Returns { human: true } as RecipesArgs
 */

import {
  recipesArgsContract,
  type RecipesArgs,
} from '../../contracts/recipes-args/recipes-args-contract';
import { siegelenseOutputStatics } from '../../statics/siegelense-output/siegelense-output-statics';

const KNOWN_FLAGS = [siegelenseOutputStatics.flags.json] as const;
const RECIPES_TAKES_NO_INSTANCE =
  'Takes no instance. `recipes` lists what states can be created, not what a running instance is doing — no instance is needed to answer it.';
const USAGE = 'Usage: dungeonmaster siegelense recipes [--json]';

export const recipesArgsParseTransformer = ({ args }: { args: readonly string[] }): RecipesArgs => {
  for (const arg of args) {
    if (arg === siegelenseOutputStatics.flags.json) {
      continue;
    }

    if (arg.startsWith('--')) {
      throw new Error(
        `Unknown flag: ${arg}\n\n${RECIPES_TAKES_NO_INSTANCE}\n\n` +
          `Accepted flags: ${KNOWN_FLAGS.join(', ')}\n\n${USAGE}`,
      );
    }

    throw new Error(
      `Unexpected positional argument: ${arg}\n\n` +
        `${RECIPES_TAKES_NO_INSTANCE} Every value must directly follow the flag it belongs to.\n\n${USAGE}`,
    );
  }

  const human = !args.includes(siegelenseOutputStatics.flags.json);

  return recipesArgsContract.parse({ human });
};
