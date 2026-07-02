/**
 * PURPOSE: Defines a structured test assertion for a quest step, replacing free-form descriptions with behavioral specs
 *
 * USAGE:
 * stepAssertionContract.parse({prefix: 'VALID', input: '{valid input}', expected: 'returns expected result'});
 * // Returns: StepAssertion object with branded fields
 *
 * The `id` is server-stamped on write (agents never author it). Once present, the modify-quest
 * array-upsert merges a step's assertions[] by id — so a partial patch can edit one assertion
 * without clobbering the others' observablesSatisfied / field values.
 */

import type { z } from 'zod';

import { stepAssertionObjectContract } from '../step-assertion-object/step-assertion-object-contract';

export const stepAssertionContract = stepAssertionObjectContract.refine(
  (data) => {
    const fieldAllowedPrefixes = new Set(['INVALID', 'INVALID_MULTIPLE']);
    const fieldRequiredPrefixes = new Set(['INVALID']);
    if (fieldRequiredPrefixes.has(data.prefix)) return data.field !== undefined;
    if (!fieldAllowedPrefixes.has(data.prefix)) return data.field === undefined;
    return true;
  },
  {
    message:
      'field is required for INVALID prefix and forbidden for non-INVALID/INVALID_MULTIPLE prefixes',
  },
);

export type StepAssertion = z.infer<typeof stepAssertionContract>;
