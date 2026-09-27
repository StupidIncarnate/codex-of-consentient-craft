/**
 * PURPOSE: Reads `dungeonmaster siegelense capacity`'s argv into a `CapacityArgs`. `--spec` is
 * REQUIRED: capacity calculation depends on spec footprint, so an absent flag is refused naming the
 * flag and, from the same `laneSpecConventionStatics` `laneSpecFindBroker`'s own unknown-spec
 * refusal reads, the known spec names — never hard-coded here.
 *
 * `--pool` is what makes the never-average rule operable from a terminal: it is the size of the pool
 * the caller is about to open, and the sample group matching it is the one the division uses.
 * `--json` outputs raw JSON instead of the default human summary.
 *
 * USAGE:
 * capacityArgsParseTransformer({ args: ['--spec', 'dungeonmaster-stack'] });
 * // Returns { specName: 'dungeonmaster-stack', poolSize: null, isJson: false } as CapacityArgs
 */

import { capacityArgsContract } from '../../contracts/capacity-args/capacity-args-contract';
import type { CapacityArgs } from '../../contracts/capacity-args/capacity-args-contract';
import { profilePoolSizeContract } from '../../contracts/profile-pool-size/profile-pool-size-contract';
import { specNameContract } from '../../contracts/spec-name/spec-name-contract';
import { laneSpecConventionStatics } from '../../statics/lane-spec-convention/lane-spec-convention-statics';
import { siegelenseOutputStatics } from '../../statics/siegelense-output/siegelense-output-statics';
import { flagContractParseTransformer } from '../flag-contract-parse/flag-contract-parse-transformer';
import { flagValueReadTransformer } from '../flag-value-read/flag-value-read-transformer';
import { numericFlagParseTransformer } from '../numeric-flag-parse/numeric-flag-parse-transformer';

const SPEC_FLAG = '--spec';
const POOL_FLAG = '--pool';
const VALUE_FLAGS = [SPEC_FLAG, POOL_FLAG] as const;
const KNOWN_FLAGS = [SPEC_FLAG, POOL_FLAG, siegelenseOutputStatics.flags.json] as const;
const USAGE = 'Usage: dungeonmaster siegelense capacity --spec <specName> [--pool <n>] [--json]';

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

  if (rawSpecName === null) {
    throw new Error(
      `${SPEC_FLAG} is required: name the lane spec to calculate capacity against. ` +
        `Capacity calculation depends on spec footprint. ` +
        `Known specs: ${laneSpecConventionStatics.browsered}, ${laneSpecConventionStatics.headless}.\n\n${USAGE}`,
    );
  }

  const specName = flagContractParseTransformer({
    flag: SPEC_FLAG,
    parse: () => specNameContract.parse(rawSpecName),
  });

  const rawPoolSize = flagValueReadTransformer({ args, flag: POOL_FLAG });
  const poolSize =
    rawPoolSize === null
      ? null
      : numericFlagParseTransformer({
          flag: POOL_FLAG,
          raw: rawPoolSize,
          accepts: 'a whole number of 1 or more',
          parse: (value) => profilePoolSizeContract.parse(value),
        });

  const isJson = args.includes(siegelenseOutputStatics.flags.json);

  return capacityArgsContract.parse({ specName, poolSize, isJson });
};
