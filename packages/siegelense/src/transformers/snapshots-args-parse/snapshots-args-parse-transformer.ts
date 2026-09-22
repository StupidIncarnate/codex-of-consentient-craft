/**
 * PURPOSE: Reads `dungeonmaster siegelense snapshots`'s argv into a `SnapshotsArgs`, refusing any
 * flag but `--instance` and `--json` and any bare token that is not that flag's own value.
 * `--instance` is REQUIRED here, as it is on `kill` and unlike `statusArgsParseTransformer`'s
 * optional one: a snapshot lives inside one instance's throwaway home, so there is no fleet-wide form
 * to fall back on. `--human` meets the same refusal as any other unknown flag: it fails this
 * transformer's own `KNOWN_FLAGS` check below and throws naming the flag alongside the two this call
 * accepts. `SiegelenseFlow` inspects no flag itself — it routes `callArgs` straight through unread
 * (its own header says so) — so this check is the only gate any flag, `--human` included, passes
 * through.
 *
 * USAGE:
 * snapshotsArgsParseTransformer({ args: ['--instance', 'inst_7f3a9c21'] });
 * // Returns { instanceId: 'inst_7f3a9c21' } as SnapshotsArgs
 */

import { instanceIdContract } from '../../contracts/instance-id/instance-id-contract';
import {
  snapshotsArgsContract,
  type SnapshotsArgs,
} from '../../contracts/snapshots-args/snapshots-args-contract';
import { siegelenseOutputStatics } from '../../statics/siegelense-output/siegelense-output-statics';
import { flagContractParseTransformer } from '../flag-contract-parse/flag-contract-parse-transformer';
import { flagValueReadTransformer } from '../flag-value-read/flag-value-read-transformer';

const INSTANCE_FLAG = '--instance';
const KNOWN_FLAGS = [INSTANCE_FLAG, siegelenseOutputStatics.flags.json] as const;
const USAGE = 'Usage: dungeonmaster siegelense snapshots --instance <instanceId> [--json]';

export const snapshotsArgsParseTransformer = ({
  args,
}: {
  args: readonly string[];
}): SnapshotsArgs => {
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
      `${INSTANCE_FLAG} is required: snapshots are held inside one instance's own throwaway home, ` +
        `so there is no fleet-wide form.\n\n${USAGE}`,
    );
  }

  return snapshotsArgsContract.parse({
    instanceId: flagContractParseTransformer({
      flag: INSTANCE_FLAG,
      parse: () => instanceIdContract.parse(rawInstanceId),
    }),
    isJson: args.includes(siegelenseOutputStatics.flags.json),
  });
};
