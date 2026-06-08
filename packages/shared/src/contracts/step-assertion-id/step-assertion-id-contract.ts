/**
 * PURPOSE: Defines the branded UUID type for step-assertion identifiers
 *
 * USAGE:
 * stepAssertionIdContract.parse('f47ac10b-58cc-4372-a567-0e02b2c3d479');
 * // Returns: StepAssertionId branded string
 *
 * The id is server-stamped (never authored by agents) when an assertion is first written, so the
 * modify-quest array-upsert can merge a step's assertions[] by id instead of replacing the whole
 * array — preserving per-assertion fields (observablesSatisfied, field) a partial patch omits.
 */

import { z } from 'zod';

export const stepAssertionIdContract = z.string().uuid().brand<'StepAssertionId'>();

export type StepAssertionId = z.infer<typeof stepAssertionIdContract>;
