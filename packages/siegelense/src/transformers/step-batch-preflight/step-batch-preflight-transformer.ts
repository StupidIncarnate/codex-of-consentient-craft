/**
 * PURPOSE: Names every unknown step verb and every stray key in a raw `--steps` batch in words the
 * caller can act on — `Unknown step "teleport". Known steps: goto, waitFor, …` and `goto has no key
 * "bogus". It takes: path, node, expect` — where the validator's own text names neither the typed
 * value nor the accepted ones ("Invalid discriminator value", "Unrecognized key(s)"). Run it BEFORE
 * `runArgsContract.parse`; an empty answer means the batch has no unknown verb or key, and every other
 * defect (a missing field, a wrong type) is still `stepContract`'s to report. The verbs and each
 * verb's keys are read off `stepContract`'s own union members, never a typed copy, so a verb or field
 * added there is accepted and listed here with no second edit.
 *
 * USAGE:
 * stepBatchPreflightTransformer({ steps: [{ step: 'teleport' }] });
 * // Returns ['steps.0: Unknown step "teleport". Known steps: goto, waitFor, click, …']
 */

import { stepBatchProbeContract } from '../../contracts/step-batch-probe/step-batch-probe-contract';
import { stepContract } from '../../contracts/step/step-contract';

const STEP_KEY = 'step';

export const stepBatchPreflightTransformer = ({ steps }: { steps: unknown }): string[] => {
  const probe = stepBatchProbeContract.safeParse(steps);
  if (!probe.success) {
    return [];
  }

  const members = stepContract.options.map((member) => ({
    verb: member.shape.step.value,
    keys: Object.keys(member.shape).filter((key) => key !== STEP_KEY),
  }));
  const knownVerbs = members.map((member) => member.verb);

  return probe.data.flatMap((entry, index): string[] => {
    if (entry.step === undefined) {
      return [];
    }

    const member = members.find((candidate) => candidate.verb === entry.step);
    if (member === undefined) {
      return [
        `steps.${index}: Unknown step "${entry.step}". Known steps: ${knownVerbs.join(', ')}`,
      ];
    }

    const strayKeys = Object.keys(entry).filter(
      (key) => key !== STEP_KEY && !member.keys.includes(key),
    );
    if (strayKeys.length === 0) {
      return [];
    }

    const noun = strayKeys.length === 1 ? 'key' : 'keys';
    return [
      `steps.${index}: ${member.verb} has no ${noun} ${strayKeys.map((key) => `"${key}"`).join(', ')}. It takes: ${member.keys.join(', ')}`,
    ];
  });
};
