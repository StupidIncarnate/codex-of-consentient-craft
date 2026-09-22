/**
 * PURPOSE: Reads `dungeonmaster siegelense results`'s argv into a `ResultsArgs` — the widest flag
 * surface of the seven calls, because five of its flags (`--where-path`, `--where-method`,
 * `--where-nth`, `--where-level`, `--where-steps`) assemble ONE `where` clause rather than five
 * top-level fields. `where` stays `null` when none of the five is typed, never an object of five
 * nulls — `resultsReadBroker` treats a present `where` as an active filter, so an all-null object
 * would silently filter instead of not filtering. Reach for this over `compareArgsParseTransformer`
 * or `killArgsParseTransformer`: those close over one or three flags; this one is the call whose
 * `--help` page has to print an accepted-value list per flag, so `--kind`'s vocabulary is checked
 * through `resultKindContract` (derived from `resultsStatics.kinds.all`) rather than retyped, and a
 * seventh kind arriving later costs one edit. Every OTHER branded parse (`--instance`, `--run`,
 * `--step`, the four `--where-*` flags that carry a contract, `--since`) goes through
 * `flagContractParseTransformer`, so a bad value answers with the contract's own message under its
 * own flag's name rather than a raw ZodError; `--kind` does not need it because the hand-written
 * check above it already refuses an invalid value before this point, and `--where-path`/`--fields`
 * do not need it because `contentTextContract`/`resultFieldContract` cannot reject a non-empty
 * string. `--run` and `--since boot` are mutually exclusive — the synopsis in
 * `siegelense-help-statics.ts` reads `[--run <runId> | --since boot]` — so naming both refuses by
 * naming both flags, the same shape `runArgsParseTransformer` refuses `--steps`/`--steps-file` in.
 * Unlike that pair, neither flag here is required: omitting both is the ordinary "resolve the
 * latest run" case, and only BOTH present is refused.
 *
 * USAGE:
 * resultsArgsParseTransformer({
 *   args: ['--instance', 'inst_7f3a9c21', '--run', 'run_2', '--kind', 'network'],
 * });
 * // Returns ResultsArgs { instanceId: 'inst_7f3a9c21', runId: 'run_2', step: null,
 * //   kind: 'network', where: null, fields: null, since: null, isJson: false }
 */

import { arrayIndexContract, contentTextContract } from '@dungeonmaster/shared/contracts';

import { httpMethodContract } from '../../contracts/http-method/http-method-contract';
import { instanceIdContract } from '../../contracts/instance-id/instance-id-contract';
import { logLevelContract } from '../../contracts/log-level/log-level-contract';
import { resultFieldContract } from '../../contracts/result-field/result-field-contract';
import { resultKindContract } from '../../contracts/result-kind/result-kind-contract';
import { resultWhereContract } from '../../contracts/result-where/result-where-contract';
import {
  resultsArgsContract,
  type ResultsArgs,
} from '../../contracts/results-args/results-args-contract';
import { runIdContract } from '../../contracts/run-id/run-id-contract';
import { sinceMarkerContract } from '../../contracts/since-marker/since-marker-contract';
import { stepIndexContract } from '../../contracts/step-index/step-index-contract';
import { stepRangeContract } from '../../contracts/step-range/step-range-contract';
import { resultsStatics } from '../../statics/results/results-statics';
import { siegelenseOutputStatics } from '../../statics/siegelense-output/siegelense-output-statics';
import { flagContractParseTransformer } from '../flag-contract-parse/flag-contract-parse-transformer';
import { flagValueReadTransformer } from '../flag-value-read/flag-value-read-transformer';

const INSTANCE_FLAG = '--instance';
const RUN_FLAG = '--run';
const STEP_FLAG = '--step';
const KIND_FLAG = '--kind';
const SINCE_FLAG = '--since';
const WHERE_PATH_FLAG = '--where-path';
const WHERE_METHOD_FLAG = '--where-method';
const WHERE_NTH_FLAG = '--where-nth';
const WHERE_LEVEL_FLAG = '--where-level';
const WHERE_STEPS_FLAG = '--where-steps';
const FIELDS_FLAG = '--fields';

const VALUE_FLAGS = [
  INSTANCE_FLAG,
  RUN_FLAG,
  STEP_FLAG,
  KIND_FLAG,
  SINCE_FLAG,
  WHERE_PATH_FLAG,
  WHERE_METHOD_FLAG,
  WHERE_NTH_FLAG,
  WHERE_LEVEL_FLAG,
  WHERE_STEPS_FLAG,
  FIELDS_FLAG,
];
const KNOWN_FLAGS = [...VALUE_FLAGS, siegelenseOutputStatics.flags.json];
const USAGE =
  'Usage: dungeonmaster siegelense results --instance <instanceId> [--run <runId>] ' +
  '[--step <n>] [--kind <kind>] [--where-path <p>] [--where-method <method>] ' +
  '[--where-nth <n>] [--where-level <level>] [--where-steps <a-b>] [--fields <a,b,c>] ' +
  '[--since boot] [--json]';

export const resultsArgsParseTransformer = ({ args }: { args: readonly string[] }): ResultsArgs => {
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

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
    throw new Error(`${INSTANCE_FLAG} is required: name the instance to read evidence from.`);
  }

  const runValue = flagValueReadTransformer({ args, flag: RUN_FLAG });
  const stepValue = flagValueReadTransformer({ args, flag: STEP_FLAG });
  const kindValue = flagValueReadTransformer({ args, flag: KIND_FLAG });
  const sinceValue = flagValueReadTransformer({ args, flag: SINCE_FLAG });
  const fieldsValue = flagValueReadTransformer({ args, flag: FIELDS_FLAG });

  if (runValue !== null && sinceValue !== null) {
    throw new Error(
      `${RUN_FLAG} and ${SINCE_FLAG} are mutually exclusive: ${RUN_FLAG} names one run's ` +
        `evidence, ${SINCE_FLAG} reads the whole boot timeline, and both were given.`,
    );
  }

  if (kindValue !== null && !resultKindContract.safeParse(kindValue).success) {
    throw new Error(
      `${KIND_FLAG} must be one of: ${resultsStatics.kinds.all.join(', ')}. Received: "${kindValue}".`,
    );
  }

  const wherePathValue = flagValueReadTransformer({ args, flag: WHERE_PATH_FLAG });
  const whereMethodValue = flagValueReadTransformer({ args, flag: WHERE_METHOD_FLAG });
  const whereNthValue = flagValueReadTransformer({ args, flag: WHERE_NTH_FLAG });
  const whereLevelValue = flagValueReadTransformer({ args, flag: WHERE_LEVEL_FLAG });
  const whereStepsValue = flagValueReadTransformer({ args, flag: WHERE_STEPS_FLAG });

  const hasWhere =
    wherePathValue !== null ||
    whereMethodValue !== null ||
    whereNthValue !== null ||
    whereLevelValue !== null ||
    whereStepsValue !== null;

  return resultsArgsContract.parse({
    instanceId: flagContractParseTransformer({
      flag: INSTANCE_FLAG,
      parse: () => instanceIdContract.parse(instanceValue),
    }),
    runId:
      runValue === null
        ? null
        : flagContractParseTransformer({
            flag: RUN_FLAG,
            parse: () => runIdContract.parse(runValue),
          }),
    step:
      stepValue === null
        ? null
        : flagContractParseTransformer({
            flag: STEP_FLAG,
            parse: () => stepIndexContract.parse(Number(stepValue)),
          }),
    kind: kindValue === null ? null : resultKindContract.parse(kindValue),
    where: hasWhere
      ? resultWhereContract.parse({
          path: wherePathValue === null ? null : contentTextContract.parse(wherePathValue),
          method:
            whereMethodValue === null
              ? null
              : flagContractParseTransformer({
                  flag: WHERE_METHOD_FLAG,
                  parse: () => httpMethodContract.parse(whereMethodValue),
                }),
          nth:
            whereNthValue === null
              ? null
              : flagContractParseTransformer({
                  flag: WHERE_NTH_FLAG,
                  parse: () => arrayIndexContract.parse(Number(whereNthValue)),
                }),
          level:
            whereLevelValue === null
              ? null
              : flagContractParseTransformer({
                  flag: WHERE_LEVEL_FLAG,
                  parse: () => logLevelContract.parse(whereLevelValue),
                }),
          steps:
            whereStepsValue === null
              ? null
              : flagContractParseTransformer({
                  flag: WHERE_STEPS_FLAG,
                  parse: () => stepRangeContract.parse(whereStepsValue),
                }),
        })
      : null,
    fields:
      fieldsValue === null
        ? null
        : fieldsValue.split(',').map((token) => {
            if (token.length === 0) {
              throw new Error(
                `${FIELDS_FLAG} has an empty member: "${fieldsValue}" splits on "," into an ` +
                  `empty token. Each entry between commas must be a non-empty field name.`,
              );
            }
            return resultFieldContract.parse(token);
          }),
    since:
      sinceValue === null
        ? null
        : flagContractParseTransformer({
            flag: SINCE_FLAG,
            parse: () => sinceMarkerContract.parse(sinceValue),
          }),
    isJson: args.includes(siegelenseOutputStatics.flags.json),
  });
};
