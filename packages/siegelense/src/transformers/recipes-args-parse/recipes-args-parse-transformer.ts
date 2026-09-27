/**
 * PURPOSE: Reads `dungeonmaster siegelense recipes`'s argv into a `RecipesArgs`. Every flag but
 * `--json` refuses — `recipes` needs no `--instance`, because it lists what states CAN
 * be created rather than reporting on one that is running (siegelense-recipes.md's "The calls this
 * document uses" section, "No instance needed"). That explanation is worth stating only when the
 * unknown flag typed IS `--instance` — it fits no other flag, so a caller who mistypes `--kind` or
 * `--human` gets the plain unknown-flag refusal instead of a non sequitur about instances. A stray
 * positional argument carries the "no instance needed" reason alone: recipes has no flag that takes
 * a value, so the canonical "a value follows its flag" sentence its value-taking siblings carry would
 * send a caller looking for a flag that does not exist here, and is omitted.
 *
 * USAGE:
 * recipesArgsParseTransformer({ args: [] });
 * // Returns { isJson: false } as RecipesArgs
 */

import {
  recipesArgsContract,
  type RecipesArgs,
} from '../../contracts/recipes-args/recipes-args-contract';
import { siegelenseOutputStatics } from '../../statics/siegelense-output/siegelense-output-statics';

const INSTANCE_FLAG = '--instance';
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
      const explanation = arg === INSTANCE_FLAG ? `${RECIPES_TAKES_NO_INSTANCE}\n\n` : '';
      throw new Error(
        `Unknown flag: ${arg}\n\n${explanation}Accepted flags: ${KNOWN_FLAGS.join(', ')}\n\n${USAGE}`,
      );
    }

    throw new Error(
      `Unexpected positional argument: ${arg}\n\n${RECIPES_TAKES_NO_INSTANCE}\n\n${USAGE}`,
    );
  }

  const isJson = args.includes(siegelenseOutputStatics.flags.json);

  return recipesArgsContract.parse({ isJson });
};
