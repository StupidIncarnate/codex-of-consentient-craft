/**
 * PURPOSE: Defines a structured test assertion for a quest step, replacing free-form descriptions with behavioral specs
 *
 * USAGE:
 * stepAssertionContract.parse({prefix: 'VALID', input: '{valid input}', expected: 'returns expected result'});
 * // Returns: StepAssertion object with branded fields
 */

import { z } from 'zod';

const stepAssertionPrefixContract = z.enum([
  'VALID',
  'INVALID',
  'INVALID_MULTIPLE',
  'ERROR',
  'EDGE',
  'EMPTY',
]);

export type StepAssertionPrefix = z.infer<typeof stepAssertionPrefixContract>;

export const stepAssertionContract = z
  .object({
    prefix: stepAssertionPrefixContract,
    field: z.string().min(1).brand<'AssertionField'>().optional(),
    input: z.string().min(1).brand<'AssertionInput'>(),
    expected: z.string().min(1).brand<'AssertionExpected'>(),
  })
  .refine(
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
