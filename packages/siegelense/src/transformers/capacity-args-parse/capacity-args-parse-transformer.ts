/**
 * PURPOSE: Reads `dungeonmaster siegelense capacity`'s argv into a `CapacityArgs`. BOTH flags are
 * optional, unlike `profileArgsParseTransformer`'s required `--spec`: the spec's own form is the
 * bare `capacity {}` (siegelense-tooling.md line 2505), so an absent flag parses to `null` and the
 * broker reads its knob rather than refusing. Reach for this over `profileArgsParseTransformer` even
 * though both name a spec — `profile` reports one spec's measurements and has no defensible default,
 * while `capacity` answers a question about the MACHINE and stays askable with nothing typed.
 *
 * `--pool` is what makes the never-average rule operable from a terminal: it is the size of the pool
 * the caller is about to open, and the sample group matching it is the one the division uses (line
 * 2526). No `--human` appears among the accepted flags, which is the whole opt-out — `SiegelenseFlow`
 * derives which calls admit it from each call's own help entry.
 *
 * USAGE:
 * capacityArgsParseTransformer({ args: [] });
 * // Returns { specName: null, poolSize: null } as CapacityArgs
 */

import { capacityArgsContract } from '../../contracts/capacity-args/capacity-args-contract';
import type { CapacityArgs } from '../../contracts/capacity-args/capacity-args-contract';
import { profilePoolSizeContract } from '../../contracts/profile-pool-size/profile-pool-size-contract';
import { specNameContract } from '../../contracts/spec-name/spec-name-contract';
import { siegelenseOutputStatics } from '../../statics/siegelense-output/siegelense-output-statics';
import { flagContractParseTransformer } from '../flag-contract-parse/flag-contract-parse-transformer';
import { flagValueReadTransformer } from '../flag-value-read/flag-value-read-transformer';

const SPEC_FLAG = '--spec';
const POOL_FLAG = '--pool';
const VALUE_FLAGS = [SPEC_FLAG, POOL_FLAG] as const;
const KNOWN_FLAGS = [SPEC_FLAG, POOL_FLAG, siegelenseOutputStatics.flags.json] as const;
const USAGE = 'Usage: dungeonmaster siegelense capacity [--spec <specName>] [--pool <n>] [--json]';

export const capacityArgsParseTransformer = ({
  args,
}: {
  args: readonly string[];
}): CapacityArgs => {
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg !== undefined && VALUE_FLAGS.some((flag) => flag === arg)) {
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
  const specName =
    rawSpecName === null
      ? null
      : flagContractParseTransformer({
          flag: SPEC_FLAG,
          parse: () => specNameContract.parse(rawSpecName),
        });

  const rawPoolSize = flagValueReadTransformer({ args, flag: POOL_FLAG });
  const poolSize =
    rawPoolSize === null
      ? null
      : flagContractParseTransformer({
          flag: POOL_FLAG,
          parse: () => profilePoolSizeContract.parse(Number(rawPoolSize)),
        });

  return capacityArgsContract.parse({ specName, poolSize });
};
