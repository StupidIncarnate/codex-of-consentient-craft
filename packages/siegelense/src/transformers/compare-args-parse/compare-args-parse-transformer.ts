/**
 * PURPOSE: Reads `dungeonmaster siegelense compare`'s argv into a `CompareArgs` — `--instance`,
 * `--run-a` and `--run-b` all required, `--json` accepted and contributing no field, the same no-op
 * affirmation of the default every other siegelense call takes. `compare` has no cross-instance
 * form — two runs are only comparable inside one instance's own timeline — so `--instance-a` /
 * `--instance-b` are refused BY NAME with that reason rather than falling through to a generic
 * "unknown flag": a caller reaching for those two spellings is reaching for a form that does not
 * exist, and a generic refusal would teach it nothing about why.
 * `--instance`, `--run-a` and `--run-b` each parse through `flagContractParseTransformer`, so a
 * badly-shaped id answers with the contract's own message under its flag's name rather than a raw
 * ZodError.
 *
 * USAGE:
 * compareArgsParseTransformer({ args: ['--instance', 'inst_7f3a9c21', '--run-a', 'run_4', '--run-b', 'run_5'] });
 * // Returns CompareArgs { instanceId: 'inst_7f3a9c21', runA: 'run_4', runB: 'run_5' }
 */

import { compareArgsContract } from '../../contracts/compare-args/compare-args-contract';
import type { CompareArgs } from '../../contracts/compare-args/compare-args-contract';
import { instanceIdContract } from '../../contracts/instance-id/instance-id-contract';
import { runIdContract } from '../../contracts/run-id/run-id-contract';
import { siegelenseOutputStatics } from '../../statics/siegelense-output/siegelense-output-statics';
import { flagContractParseTransformer } from '../flag-contract-parse/flag-contract-parse-transformer';
import { flagValueReadTransformer } from '../flag-value-read/flag-value-read-transformer';

const INSTANCE_FLAG = '--instance';
const RUN_A_FLAG = '--run-a';
const RUN_B_FLAG = '--run-b';

const CROSS_INSTANCE_FLAG_A = '--instance-a';
const CROSS_INSTANCE_FLAG_B = '--instance-b';

const VALUE_FLAGS = [INSTANCE_FLAG, RUN_A_FLAG, RUN_B_FLAG];
const KNOWN_FLAGS = [...VALUE_FLAGS, siegelenseOutputStatics.flags.json];
const USAGE =
  'Usage: dungeonmaster siegelense compare --instance <instanceId> --run-a <runId> --run-b <runId> [--json]';

const CROSS_INSTANCE_REFUSAL =
  `${CROSS_INSTANCE_FLAG_A} and ${CROSS_INSTANCE_FLAG_B} are not accepted: there is no ` +
  `cross-instance form. Name one ${INSTANCE_FLAG} and two runs (${RUN_A_FLAG}, ${RUN_B_FLAG}) ` +
  `inside its own timeline — two different instances share nothing but a spec.`;

export const compareArgsParseTransformer = ({ args }: { args: readonly string[] }): CompareArgs => {
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === CROSS_INSTANCE_FLAG_A || arg === CROSS_INSTANCE_FLAG_B) {
      throw new Error(CROSS_INSTANCE_REFUSAL);
    }

    if (arg !== undefined && VALUE_FLAGS.includes(arg)) {
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

  const instanceValue = flagValueReadTransformer({ args, flag: INSTANCE_FLAG });
  if (instanceValue === null) {
    throw new Error(`${INSTANCE_FLAG} is required: name the instance both runs belong to.`);
  }

  const runAValue = flagValueReadTransformer({ args, flag: RUN_A_FLAG });
  if (runAValue === null) {
    throw new Error(`${RUN_A_FLAG} is required: name the earlier run in the diff.`);
  }

  const runBValue = flagValueReadTransformer({ args, flag: RUN_B_FLAG });
  if (runBValue === null) {
    throw new Error(`${RUN_B_FLAG} is required: name the later run in the diff.`);
  }

  return compareArgsContract.parse({
    instanceId: flagContractParseTransformer({
      flag: INSTANCE_FLAG,
      parse: () => instanceIdContract.parse(instanceValue),
    }),
    runA: flagContractParseTransformer({
      flag: RUN_A_FLAG,
      parse: () => runIdContract.parse(runAValue),
    }),
    runB: flagContractParseTransformer({
      flag: RUN_B_FLAG,
      parse: () => runIdContract.parse(runBValue),
    }),
    json: args.includes(siegelenseOutputStatics.flags.json),
  });
};
