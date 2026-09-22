/**
 * PURPOSE: Reads `dungeonmaster siegelense kill`'s argv into a `KillArgs`, refusing any flag but
 * `--instance` and `--json` and any bare token that is not that flag's own value. `--instance` is
 * REQUIRED here — unlike `statusArgsParseTransformer`'s optional one — because `kill` has no bare
 * fleet-listing form: there is no instance to tear down without naming one. The id parses through
 * `flagContractParseTransformer`, so a badly-shaped `--instance` answers with the contract's own
 * message under `--instance` rather than a raw ZodError.
 *
 * USAGE:
 * killArgsParseTransformer({ args: ['--instance', 'inst_7f3a9c21'] });
 * // Returns { instanceId: 'inst_7f3a9c21' } as KillArgs
 */

import { instanceIdContract } from '../../contracts/instance-id/instance-id-contract';
import { killArgsContract, type KillArgs } from '../../contracts/kill-args/kill-args-contract';
import { siegelenseOutputStatics } from '../../statics/siegelense-output/siegelense-output-statics';
import { flagContractParseTransformer } from '../flag-contract-parse/flag-contract-parse-transformer';
import { flagValueReadTransformer } from '../flag-value-read/flag-value-read-transformer';

const INSTANCE_FLAG = '--instance';
const KNOWN_FLAGS = [INSTANCE_FLAG, siegelenseOutputStatics.flags.json] as const;
const USAGE = 'Usage: dungeonmaster siegelense kill --instance <instanceId> [--json]';

export const killArgsParseTransformer = ({ args }: { args: readonly string[] }): KillArgs => {
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === INSTANCE_FLAG) {
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

  const rawInstanceId = flagValueReadTransformer({ args, flag: INSTANCE_FLAG });
  if (rawInstanceId === null) {
    throw new Error(
      `${INSTANCE_FLAG} is required: kill needs an instance id to tear down.\n\n${USAGE}`,
    );
  }

  return killArgsContract.parse({
    instanceId: flagContractParseTransformer({
      flag: INSTANCE_FLAG,
      parse: () => instanceIdContract.parse(rawInstanceId),
    }),
    isJson: args.includes(siegelenseOutputStatics.flags.json),
  });
};
