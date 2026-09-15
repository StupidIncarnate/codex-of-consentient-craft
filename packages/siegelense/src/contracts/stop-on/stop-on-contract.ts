/**
 * PURPOSE: A batch's own policy for whether a failing step ends the batch — `error` (the default,
 * `stepStatics.defaults.stopOn`) or `never`. Reach for this over StepExpectation: StopOn is set ONCE
 * per batch and governs whether the REMAINING steps still run; StepExpectation is set per STEP and
 * governs whether THAT step's own failure counts as a failure at all. An adversarial batch sets
 * `stopOn: 'never'` on the whole run and `expect: 'error'` on the one step meant to break.
 *
 * USAGE:
 * stopOnContract.parse('never');
 * // Returns a branded StopOn
 */

import { z } from 'zod';

export const stopOnContract = z.enum(['error', 'never']).brand<'StopOn'>();

export type StopOn = z.infer<typeof stopOnContract>;
