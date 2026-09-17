/**
 * PURPOSE: Reads `dungeonmaster siegelense cleanup`'s argv into a `CleanupArgs`. Every flag but
 * `--json` and `--human` refuses, carrying the reason nothing can be selected — cleanup "takes no
 * input" (siegelense-tooling.md line 2409) — AND the canonical positional-argument sentence its
 * siblings all carry, so a stray positional argument here states both why nothing was expected and
 * the general rule every other call states for the identical mistake. The sentence here is a
 * SHORTER one than `siegelenseHelpStatics.calls.cleanup.refusals[0]` on purpose, and the two are
 * allowed to differ in length but never in fact.
 *
 * USAGE:
 * cleanupArgsParseTransformer({ args: [] });
 * // Returns { human: false } as CleanupArgs
 */

import {
  cleanupArgsContract,
  type CleanupArgs,
} from '../../contracts/cleanup-args/cleanup-args-contract';
import { siegelenseOutputStatics } from '../../statics/siegelense-output/siegelense-output-statics';

const KNOWN_FLAGS = [
  siegelenseOutputStatics.flags.json,
  siegelenseOutputStatics.flags.human,
] as const;
// Deliberately shorter than the help page's own refusal: an argv mistake needs the half that says
// nothing can be selected, not the whole retention story. What it must NOT say is that cleanup
// ages no asset — it does, on its own windows, and that sentence was true only before prune landed.
const CLEANUP_TAKES_NO_INPUT =
  'Takes no input: it reaps stale instances and ages assets on their own windows, with nothing to select.';
const USAGE = 'Usage: dungeonmaster siegelense cleanup [--json] [--human]';

export const cleanupArgsParseTransformer = ({ args }: { args: readonly string[] }): CleanupArgs => {
  for (const arg of args) {
    if (arg === siegelenseOutputStatics.flags.json || arg === siegelenseOutputStatics.flags.human) {
      continue;
    }

    if (arg.startsWith('--')) {
      throw new Error(
        `Unknown flag: ${arg}\n\n${CLEANUP_TAKES_NO_INPUT}\n\n` +
          `Accepted flags: ${KNOWN_FLAGS.join(', ')}\n\n${USAGE}`,
      );
    }

    throw new Error(
      `Unexpected positional argument: ${arg}\n\n` +
        `${CLEANUP_TAKES_NO_INPUT} Every value must directly follow the flag it belongs to.\n\n${USAGE}`,
    );
  }

  const human = args.includes(siegelenseOutputStatics.flags.human);

  return cleanupArgsContract.parse({ human });
};
