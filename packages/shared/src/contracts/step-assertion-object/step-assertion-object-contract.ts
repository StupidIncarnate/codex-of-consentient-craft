/**
 * PURPOSE: The un-refined base object for a quest step assertion, so partial-patch callers can build a relaxed variant
 *
 * USAGE:
 * stepAssertionObjectContract.partial().required({ id: true });
 * // Returns a ZodObject usable for id-keyed partial assertion patches (the refined stepAssertionContract is a
 * // ZodEffects and cannot be .partial()/.extend()-ed). The prefix/field refine still runs at the post-merge
 * // questContract.parse, so relaxing this shape at the input layer loses no enforcement.
 */

import { z } from 'zod';

import { observableIdContract } from '../observable-id/observable-id-contract';
import { stepAssertionIdContract } from '../step-assertion-id/step-assertion-id-contract';

const stepAssertionPrefixContract = z.enum([
  'VALID',
  'INVALID',
  'INVALID_MULTIPLE',
  'ERROR',
  'EDGE',
  'EMPTY',
]);

export type StepAssertionPrefix = z.infer<typeof stepAssertionPrefixContract>;

export const stepAssertionObjectContract = z.object({
  id: stepAssertionIdContract
    .optional()
    .describe(
      'Server-stamped identifier. Omitted by authors; assigned on first write so the modify-quest upsert can merge assertions[] by id rather than replacing the whole array.',
    ),
  prefix: stepAssertionPrefixContract,
  field: z.string().min(1).brand<'AssertionField'>().optional(),
  input: z.string().min(1).brand<'AssertionInput'>(),
  expected: z.string().min(1).brand<'AssertionExpected'>(),
  observablesSatisfied: z
    .array(observableIdContract)
    .optional()
    .describe(
      'Observables proven by this specific assertion. Validator V8 unions step-level and assertion-level observable claims when checking coverage.',
    ),
});

export type StepAssertionObject = z.infer<typeof stepAssertionObjectContract>;
