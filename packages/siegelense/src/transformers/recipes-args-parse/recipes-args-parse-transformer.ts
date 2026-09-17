/**
 * PURPOSE: Reads `dungeonmaster siegelense recipes`'s argv into a `RecipesArgs`. The call takes no
 * selector of any kind — no `--instance`, no `--name`, no filter — because it lists what states can
 * be created before anything has been seeded, and narrowing a catalogue you have not read yet is
 * the query-everything the listing exists to prevent. So every flag but `--json`/`--human` is
 * refused BY NAME, and a positional is refused too; both messages carry the accepted set and the
 * usage line, the same shape `statusArgsParseTransformer` uses.
 *
 * USAGE:
 * recipesArgsParseTransformer({ args: [] });
 * // Returns { human: false } as RecipesArgs
 *
 * recipesArgsParseTransformer({ args: ['--human'] });
 * // Returns { human: true } as RecipesArgs
 */

import {
  recipesArgsContract,
  type RecipesArgs,
} from '../../contracts/recipes-args/recipes-args-contract';
import { siegelenseOutputStatics } from '../../statics/siegelense-output/siegelense-output-statics';

const KNOWN_FLAGS = [siegelenseOutputStatics.flags.json, siegelenseOutputStatics.flags.human];
const USAGE = 'Usage: dungeonmaster siegelense recipes [--json] [--human]';

export const recipesArgsParseTransformer = ({ args }: { args: readonly string[] }): RecipesArgs => {
  for (const arg of args) {
    if (arg === siegelenseOutputStatics.flags.json || arg === siegelenseOutputStatics.flags.human) {
      continue;
    }

    if (arg.startsWith('--')) {
      throw new Error(
        `Unknown flag: ${arg}\n\nAccepted flags: ${KNOWN_FLAGS.join(', ')}\n\n` +
          `recipes takes no selector — it lists every recipe, and there is nothing to narrow before you have read it.\n\n${USAGE}`,
      );
    }

    throw new Error(
      `Unexpected positional argument: ${arg}\n\n` +
        `recipes names no recipe: it lists them all, so a name here would be a filter on a catalogue you have not read yet.\n\n${USAGE}`,
    );
  }

  return recipesArgsContract.parse({
    human: args.includes(siegelenseOutputStatics.flags.human),
  });
};
