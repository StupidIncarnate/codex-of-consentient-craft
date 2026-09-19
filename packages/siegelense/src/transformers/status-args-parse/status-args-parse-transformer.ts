/**
 * PURPOSE: Reads `dungeonmaster siegelense status`'s argv into a `StatusArgs` — `--instance` is
 * OPTIONAL here, unlike `killArgsParseTransformer`'s required one: the bare form lists the whole
 * fleet (siegelense-tooling.md line 2443), so an absent flag parses to `instanceId: null` rather
 * than a refusal. Outputs the human-readable table and text format by default (`human: true`),
 * reaching for `statusAnswerRenderTransformer`; passing `--json` explicitly sets `human: false` to
 * output the raw `StatusAnswer` JSON document instead. A named id parses through
 * `flagContractParseTransformer`, so a badly-shaped `--instance` answers with the contract's own
 * message under `--instance` rather than a raw ZodError.
 *
 * USAGE:
 * statusArgsParseTransformer({ args: [] });
 * // Returns { instanceId: null, human: true } as StatusArgs
 *
 * statusArgsParseTransformer({ args: ['--json'] });
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
const BRANCH_FLAG = '--branch';
const SINCE_FLAG = '--since';
const KNOWN_FLAGS = [
  INSTANCE_FLAG,
  BRANCH_FLAG,
  SINCE_FLAG,
  siegelenseOutputStatics.flags.json,
] as const;
const USAGE =
  'Usage: dungeonmaster siegelense status [--instance <instanceId>] [--branch <name>] [--since <1hr|6hr|1day>] [--json]';

export const statusArgsParseTransformer = ({ args }: { args: readonly string[] }): StatusArgs => {
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === INSTANCE_FLAG || arg === BRANCH_FLAG || arg === SINCE_FLAG) {
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
  const instanceId =
    rawInstanceId === null
      ? null
      : flagContractParseTransformer({
          flag: INSTANCE_FLAG,
          parse: () => instanceIdContract.parse(rawInstanceId),
        });

  const rawBranch = flagValueReadTransformer({ args, flag: BRANCH_FLAG });
  const rawSince = flagValueReadTransformer({ args, flag: SINCE_FLAG });

  let since: '1h' | '6h' | '1d' | null = null;
  if (rawSince !== null) {
    if (rawSince === '1h' || rawSince === '1hr') {
      since = '1h';
    } else if (rawSince === '6h' || rawSince === '6hr') {
      since = '6h';
    } else if (rawSince === '1d' || rawSince === '1day') {
      since = '1d';
    } else {
      throw new Error(
        `--since: Only coarse-grained time windows are allowed (1hr, 6hr, 1day). Granular intervals are refused to prevent granular abuse.`,
      );
    }
  }

  const human = !args.includes(siegelenseOutputStatics.flags.json);

  return statusArgsContract.parse({
    instanceId,
    branch: rawBranch,
    since,
    human,
  });
};
