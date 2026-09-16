/**
 * PURPOSE: Reads `dungeonmaster siegelense status`'s argv into a `StatusArgs` — `--instance` is
 * OPTIONAL here, unlike `killArgsParseTransformer`'s required one: the bare form lists the whole
 * fleet (siegelense-tooling.md line 2443), so an absent flag parses to `instanceId: null` rather
 * than a refusal. `--human` is one of the two calls with its own renderer (spec §3.A); every other
 * built call refuses that flag rather than silently answering JSON anyway. A named id parses through
 * `flagContractParseTransformer`, so a badly-shaped `--instance` answers with the contract's own
 * message under `--instance` rather than a raw ZodError.
 *
 * USAGE:
 * statusArgsParseTransformer({ args: [] });
 * // Returns { instanceId: null, human: false } as StatusArgs
 */

import { instanceIdContract } from '../../contracts/instance-id/instance-id-contract';
import {
  statusArgsContract,
  type StatusArgs,
} from '../../contracts/status-args/status-args-contract';
import { siegelenseOutputStatics } from '../../statics/siegelense-output/siegelense-output-statics';
import { flagContractParseTransformer } from '../flag-contract-parse/flag-contract-parse-transformer';
import { flagValueReadTransformer } from '../flag-value-read/flag-value-read-transformer';

const INSTANCE_FLAG = '--instance';
const KNOWN_FLAGS = [
  INSTANCE_FLAG,
  siegelenseOutputStatics.flags.json,
  siegelenseOutputStatics.flags.human,
] as const;
const USAGE = 'Usage: dungeonmaster siegelense status [--instance <instanceId>] [--json] [--human]';

export const statusArgsParseTransformer = ({ args }: { args: readonly string[] }): StatusArgs => {
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
        `Every value must directly follow the flag it belongs to.\n\n${USAGE}`,
    );
  }

  const rawInstanceId = flagValueReadTransformer({ args, flag: INSTANCE_FLAG });
  const instanceId =
    rawInstanceId === null
      ? null
      : flagContractParseTransformer({
          flag: INSTANCE_FLAG,
          parse: () => instanceIdContract.parse(rawInstanceId),
        });
  const human = args.includes(siegelenseOutputStatics.flags.human);

  return statusArgsContract.parse({ instanceId, human });
};
