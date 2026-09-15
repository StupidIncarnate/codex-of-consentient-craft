/**
 * PURPOSE: What a single step's own outcome is expected to be — `ok` (the default,
 * `stepStatics.defaults.expect`) or `error`, so an adversarial step that is SUPPOSED to fail does not
 * stop a batch or read as a bug. Reach for this over StopOn: StepExpectation is per-step and decides
 * whether THIS step's result counts as expected; StopOn is per-batch and decides whether an
 * unexpected result halts the steps still queued behind it.
 *
 * USAGE:
 * stepExpectationContract.parse('error');
 * // Returns a branded StepExpectation
 */

import { z } from 'zod';

export const stepExpectationContract = z.enum(['ok', 'error']).brand<'StepExpectation'>();

export type StepExpectation = z.infer<typeof stepExpectationContract>;
