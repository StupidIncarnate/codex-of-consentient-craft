/**
 * PURPOSE: Reads `dungeonmaster siegelense run`'s argv into a `RunArgs` — the instance to drive, the
 * parsed batch of steps, and the batch's stop policy. `--steps` carries the batch's JSON array
 * inline in argv, so this transformer parses that value with no further I/O. `--steps-file` names a
 * file the array lives in instead, and a `transformers/` file can never import `fs` — the pre-edit
 * `@dungeonmaster/enforce-import-dependencies` rule refuses the write before it lands — so the
 * CALLER reads that file first and hands its text back as `stepsFileContent`; `null` whenever
 * `--steps-file` was never named. Exactly one of the two flags is required: naming both, or naming
 * neither, refuses by naming both flags, never a silent preference for one. Every branded parse —
 * `--instance`, `--stop-on`, and the final `runArgsContract.parse` that validates `steps` against
 * `stepContract` — goes through `flagContractParseTransformer` so a bad value answers with the
 * contract's own message under its flag's name, attributing the composite parse's own failures
 * (a malformed step) to whichever of `--steps`/`--steps-file` supplied the raw JSON. An empty array
 * is refused HERE, naming whichever flag supplied it, rather than reaching `instanceRunBroker` and
 * failing three layers down against a socket the empty batch already dialed for nothing.
 *
 * USAGE:
 * runArgsParseTransformer({
 *   args: ['--instance', 'inst_7f3a9c21', '--steps', '[{"step":"goto","path":"/"}]'],
 *   stepsFileContent: null,
 * });
 * // Returns { instanceId: 'inst_7f3a9c21', steps: [{ step: 'goto', path: '/', node: null, expect: 'ok' }], stopOn: 'error', isJson: false }
 */

import type { ContentText } from '@dungeonmaster/shared/contracts';

import { runArgsContract } from '../../contracts/run-args/run-args-contract';
import type { RunArgs } from '../../contracts/run-args/run-args-contract';
import { stopOnContract } from '../../contracts/stop-on/stop-on-contract';
import { siegelenseOutputStatics } from '../../statics/siegelense-output/siegelense-output-statics';
import { stepStatics } from '../../statics/step/step-statics';
import { flagContractParseTransformer } from '../flag-contract-parse/flag-contract-parse-transformer';
import { flagValueReadTransformer } from '../flag-value-read/flag-value-read-transformer';
import { siegeInstanceContract } from '@dungeonmaster/shared/contracts';

const INSTANCE_FLAG = '--instance';
const STEPS_FLAG = '--steps';
const STEPS_FILE_FLAG = '--steps-file';
const STOP_ON_FLAG = '--stop-on';

const VALUE_FLAGS = [INSTANCE_FLAG, STEPS_FLAG, STEPS_FILE_FLAG, STOP_ON_FLAG];
const KNOWN_FLAGS = [...VALUE_FLAGS, siegelenseOutputStatics.flags.json];
const USAGE =
  'Usage: dungeonmaster siegelense run --instance <instanceId> (--steps <json> | --steps-file <path>) [--stop-on error|never] [--json]';

const STEPS_SOURCE_REFUSAL =
  `Exactly one of ${STEPS_FLAG} or ${STEPS_FILE_FLAG} is required: ${STEPS_FLAG} carries the ` +
  `batch's JSON array inline, ${STEPS_FILE_FLAG} names a file holding it, and`;

const EMPTY_BATCH_MESSAGE =
  'a run needs at least one step: an empty array reaches the driver only to fail there instead of ' +
  'here, against a socket that has already been dialed.';

export const runArgsParseTransformer = ({
  args,
  stepsFileContent,
}: {
  args: readonly string[];
  stepsFileContent: ContentText | null;
}): RunArgs => {
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
    throw new Error(`${INSTANCE_FLAG} is required: name the instance this batch runs against.`);
  }

  const stepsValue = flagValueReadTransformer({ args, flag: STEPS_FLAG });
  const stepsFileValue = flagValueReadTransformer({ args, flag: STEPS_FILE_FLAG });

  if (stepsValue === null && stepsFileValue === null) {
    throw new Error(`${STEPS_SOURCE_REFUSAL} neither was given.`);
  }

  if (stepsValue !== null && stepsFileValue !== null) {
    throw new Error(`${STEPS_SOURCE_REFUSAL} both were given.`);
  }

  const sourceFlag = stepsValue === null ? STEPS_FILE_FLAG : STEPS_FLAG;
  const rawStepsJson = stepsValue === null ? stepsFileContent : stepsValue;

  if (rawStepsJson === null) {
    throw new Error(
      `${STEPS_FILE_FLAG} was given but its file content was never resolved: the caller must ` +
        `read that file before calling this transformer.`,
    );
  }

  const parsedSteps = ((): ReturnType<typeof runArgsContract.shape.steps.safeParse> => {
    try {
      return runArgsContract.shape.steps.safeParse(JSON.parse(rawStepsJson));
    } catch (error) {
      throw new Error(
        `${sourceFlag}'s value is not valid JSON: ${error instanceof Error ? error.message : String(error)}`,
        { cause: error },
      );
    }
  })();

  const stopOnValue = flagValueReadTransformer({ args, flag: STOP_ON_FLAG });

  const instanceId = flagContractParseTransformer({
    flag: INSTANCE_FLAG,
    parse: () => siegeInstanceContract.shape.id.parse(instanceValue),
  });

  const stopOn =
    stopOnValue === null
      ? stepStatics.defaults.stopOn
      : flagContractParseTransformer({
          flag: STOP_ON_FLAG,
          parse: () => stopOnContract.parse(stopOnValue),
        });

  // Refused HERE, at argv parsing — before `instanceRunBroker` ever dials the driver's socket — so
  // an empty `--steps '[]'` fails with a message naming the flag rather than surfacing three layers
  // down as `instanceRunBroker: driver for instance ... reported a failure: [` plus a raw JSON dump.
  // Checked after `instanceId`/`stopOn` above, not before: those two refusals take priority over an
  // empty batch when a caller's argv gets more than one thing wrong at once.
  if (parsedSteps.success && parsedSteps.data.length === 0) {
    throw new Error(`${sourceFlag}: ${EMPTY_BATCH_MESSAGE}`);
  }

  // The steps' own issues are reported under the `steps` path, exactly as the whole-object parse
  // below words them, because the steps were parsed on their own so the JSON text goes straight
  // into a contract.
  if (!parsedSteps.success) {
    const detail = parsedSteps.error.issues
      .map((issue) => `${['steps', ...issue.path].join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`${sourceFlag}: ${detail}`, { cause: parsedSteps.error });
  }

  return flagContractParseTransformer({
    flag: sourceFlag,
    parse: () =>
      runArgsContract.parse({
        instanceId,
        steps: parsedSteps.data,
        stopOn,
        isJson: args.includes(siegelenseOutputStatics.flags.json),
      }),
  });
};
