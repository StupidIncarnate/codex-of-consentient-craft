/**
 * PURPOSE: Reads `dungeonmaster siegelense docs`'s argv into a `DocsArgs`. `--for <scope>` is
 * OPTIONAL: omitted, `scope` parses to null and the responder serves the tool's about overview
 * alone rather than any one role's manual — decision 5's bare-call discoverability form. An
 * unrecognised scope still refuses, with its own sentence rather than through
 * `flagContractParseTransformer`: the refusal a session meets here must NAME the value it was
 * given, LIST the five scopes that exist, and say that omitting `--for` gets the overview —
 * because an empty document or a bare enum complaint both read as "this role has no
 * instructions", which is the one answer this call must never give.
 *
 * USAGE:
 * docsArgsParseTransformer({ args: [] });
 * // Returns { scope: null, isJson: false } as DocsArgs — the about overview alone
 *
 * docsArgsParseTransformer({ args: ['--for', 'walking'] });
 * // Returns { scope: 'walking', isJson: false } as DocsArgs
 *
 * docsArgsParseTransformer({ args: ['--for', 'planning', '--json'] });
 * // Returns { scope: 'planning', isJson: true } as DocsArgs
 */

import { docsArgsContract, type DocsArgs } from '../../contracts/docs-args/docs-args-contract';
import { docsScopeContract } from '../../contracts/docs-scope/docs-scope-contract';
import { siegelenseCallStatics } from '../../statics/siegelense-call/siegelense-call-statics';
import { siegelenseOutputStatics } from '../../statics/siegelense-output/siegelense-output-statics';
import { flagValueReadTransformer } from '../flag-value-read/flag-value-read-transformer';

const FOR_FLAG = '--for';
const KNOWN_FLAGS = [FOR_FLAG, siegelenseOutputStatics.flags.json] as const;
const USAGE = 'Usage: dungeonmaster siegelense docs [--for <scope>] [--json]';
const SCOPE_LIST = siegelenseCallStatics.docs.scopes.join(', ');

export const docsArgsParseTransformer = ({ args }: { args: readonly string[] }): DocsArgs => {
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === FOR_FLAG) {
      // A following token that looks like a flag is not this flag's value — leave it for the
      // next iteration, so a missing value is refused naming THIS flag, never a token further on.
      const nextToken = args[i + 1];
      if (nextToken !== undefined && !nextToken.startsWith('--')) {
        i++;
      }
      continue;
    }

    if (arg === siegelenseOutputStatics.flags.json) {
      continue;
    }

    if (arg?.startsWith('--')) {
      throw new Error(
        `Unknown flag: ${arg}\n\nAccepted flags: ${KNOWN_FLAGS.join(', ')}\n\n${USAGE}`,
      );
    }

    throw new Error(
      `Unexpected positional argument: ${arg}\n\n` +
        `docs names its scope with ${FOR_FLAG}, so a bare word here belongs to no flag.\n\n${USAGE}`,
    );
  }

  const rawScope = flagValueReadTransformer({ args, flag: FOR_FLAG });
  const isJson = args.includes(siegelenseOutputStatics.flags.json);

  if (rawScope === null) {
    return docsArgsContract.parse({ scope: null, isJson });
  }

  const parsedScope = docsScopeContract.safeParse(rawScope);
  if (!parsedScope.success) {
    throw new Error(
      `Unknown docs scope: ${rawScope}\n\n` +
        `docs serves one scope per tool-using role. The scopes that exist are: ${SCOPE_LIST}. ` +
        `Omit --for entirely to get the tool overview alone.\n\n${USAGE}`,
    );
  }

  return docsArgsContract.parse({
    scope: parsedScope.data,
    isJson,
  });
};
