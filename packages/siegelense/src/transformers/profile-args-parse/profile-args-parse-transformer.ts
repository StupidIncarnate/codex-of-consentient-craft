/**
 * PURPOSE: Reads `dungeonmaster siegelense profile`'s argv down to the one thing the call takes —
 * the spec to report on. `--spec` is REQUIRED, unlike `statusArgsParseTransformer`'s optional
 * `--instance`: there is no fleet-wide form of a profile, because a profile is keyed by one spec's
 * content hash and two specs share nothing. No `--human` appears among the accepted flags, and that
 * is the whole opt-out: `SiegelenseFlow` derives which calls admit `--human` from each call's own
 * help entry, so a page with no such flag refuses it by name before argv ever reaches here.
 *
 * USAGE:
 * profileArgsParseTransformer({ args: ['--spec', 'dungeonmaster-web'] });
 * // Returns 'dungeonmaster-web' as SpecName
 */

import { specNameContract } from '../../contracts/spec-name/spec-name-contract';
import type { SpecName } from '../../contracts/spec-name/spec-name-contract';
import { siegelenseOutputStatics } from '../../statics/siegelense-output/siegelense-output-statics';
import { flagContractParseTransformer } from '../flag-contract-parse/flag-contract-parse-transformer';
import { flagValueReadTransformer } from '../flag-value-read/flag-value-read-transformer';

const SPEC_FLAG = '--spec';
const KNOWN_FLAGS = [SPEC_FLAG, siegelenseOutputStatics.flags.json] as const;
const USAGE = 'Usage: dungeonmaster siegelense profile --spec <specName> [--json]';

export const profileArgsParseTransformer = ({ args }: { args: readonly string[] }): SpecName => {
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === SPEC_FLAG) {
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
        `Every value must directly follow the flag it belongs to.\n\n${USAGE}`,
    );
  }

  const rawSpecName = flagValueReadTransformer({ args, flag: SPEC_FLAG });

  if (rawSpecName === null) {
    throw new Error(
      `${SPEC_FLAG} is required: name the lane spec to profile. ` +
        `A profile is keyed by one spec's content hash, so there is no fleet-wide form.\n\n${USAGE}`,
    );
  }

  return flagContractParseTransformer({
    flag: SPEC_FLAG,
    parse: () => specNameContract.parse(rawSpecName),
  });
};
