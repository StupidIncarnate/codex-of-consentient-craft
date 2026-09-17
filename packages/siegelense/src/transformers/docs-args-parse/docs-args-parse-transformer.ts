/**
 * PURPOSE: Reads `dungeonmaster siegelense docs`'s argv into a `DocsArgs`. `--for` is OPTIONAL, and
 * its absence parses to `scope: null` — the whole surface — rather than a refusal, because serving
 * every scope is the form the design names first. An unrecognised scope refuses with its own
 * sentence rather than through `flagContractParseTransformer`: the refusal a session meets here
 * must NAME the value it was given and LIST the seven scopes that exist, because an empty document
 * or a bare enum complaint both read as "this role has no instructions", which is the one answer
 * this call must never give.
 *
 * USAGE:
 * docsArgsParseTransformer({ args: [] });
 * // Returns { scope: null, human: false } as DocsArgs
 *
 * docsArgsParseTransformer({ args: ['--for', 'walking', '--human'] });
 * // Returns { scope: 'walking', human: true } as DocsArgs
 */

import { docsArgsContract, type DocsArgs } from '../../contracts/docs-args/docs-args-contract';
import { docsScopeContract } from '../../contracts/docs-scope/docs-scope-contract';
import { siegelenseCallStatics } from '../../statics/siegelense-call/siegelense-call-statics';
import { siegelenseOutputStatics } from '../../statics/siegelense-output/siegelense-output-statics';
import { flagValueReadTransformer } from '../flag-value-read/flag-value-read-transformer';

const FOR_FLAG = '--for';
const KNOWN_FLAGS = [
  FOR_FLAG,
  siegelenseOutputStatics.flags.json,
  siegelenseOutputStatics.flags.human,
] as const;
const USAGE = 'Usage: dungeonmaster siegelense docs [--for <scope>] [--json] [--human]';
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

    if (arg === siegelenseOutputStatics.flags.json || arg === siegelenseOutputStatics.flags.human) {
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

  if (rawScope === null) {
    return docsArgsContract.parse({
      scope: null,
      human: args.includes(siegelenseOutputStatics.flags.human),
    });
  }

  const parsedScope = docsScopeContract.safeParse(rawScope);
  if (!parsedScope.success) {
    throw new Error(
      `Unknown docs scope: ${rawScope}\n\n` +
        `docs serves one scope per tool-using role. The scopes that exist are: ${SCOPE_LIST}.\n\n` +
        `Omit ${FOR_FLAG} to get all of them.\n\n${USAGE}`,
    );
  }

  return docsArgsContract.parse({
    scope: parsedScope.data,
    human: args.includes(siegelenseOutputStatics.flags.human),
  });
};
