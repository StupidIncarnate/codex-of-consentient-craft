/**
 * PURPOSE: Reads `dungeonmaster siegelense cleanup`'s argv into a `CleanupArgs`. Every flag but
 * `--json` refuses, carrying the reason nothing can be selected — cleanup "takes no input"
 * (siegelense-tooling.md line 2409). A stray positional argument carries that same reason alone:
 * cleanup has no flag that takes a value, so the canonical "a value follows its flag" sentence its
 * value-taking siblings carry would send a caller looking for a flag that does not exist here, and
 * is omitted. The sentence here is a SHORTER one than `siegelenseHelpStatics.calls.cleanup.refusals[0]`
 * on purpose, and the two are allowed to differ in length but never in fact.
 *
 * USAGE:
 * cleanupArgsParseTransformer({ args: [] });
 * // Returns { isJson: false } as CleanupArgs
 *
 * cleanupArgsParseTransformer({ args: ['--json'] });
 * // Returns { isJson: true } as CleanupArgs
 */

import {
  cleanupArgsContract,
  type CleanupArgs,
} from '../../contracts/cleanup-args/cleanup-args-contract';
import { siegelenseOutputStatics } from '../../statics/siegelense-output/siegelense-output-statics';

const KNOWN_FLAGS = [siegelenseOutputStatics.flags.json] as const;
// Deliberately shorter than the help page's own refusal: an argv mistake needs the half that says
// nothing can be selected, not the whole retention story. What it must NOT say is that cleanup
// ages no asset — it does, on its own windows, and that sentence was true only before prune landed.
const CLEANUP_TAKES_NO_INPUT =
  'Takes no input: it reaps stale instances and ages assets on their own windows, with nothing to select.';
const USAGE = 'Usage: dungeonmaster siegelense cleanup [--json]';

export const cleanupArgsParseTransformer = ({ args }: { args: readonly string[] }): CleanupArgs => {
  for (const arg of args) {
    if (arg === siegelenseOutputStatics.flags.json) {
      continue;
    }

    if (arg.startsWith('--')) {
      throw new Error(
        `Unknown flag: ${arg}\n\n${CLEANUP_TAKES_NO_INPUT}\n\n` +
          `Accepted flags: ${KNOWN_FLAGS.join(', ')}\n\n${USAGE}`,
      );
    }

    throw new Error(
      `Unexpected positional argument: ${arg}\n\n${CLEANUP_TAKES_NO_INPUT}\n\n${USAGE}`,
    );
  }

  const isJson = args.includes(siegelenseOutputStatics.flags.json);

  return cleanupArgsContract.parse({ isJson });
};
