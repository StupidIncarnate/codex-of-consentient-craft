/**
 * PURPOSE: The `as:` name a `seed` step gives its own output, so a later step's `{name.field}`
 * reference can resolve against it. Reach for this over NodeLabel: a NodeLabel is carried through
 * untouched for a human scanning a run's output, while a StepOutputName is a key another step's
 * reference actually resolves against.
 *
 * USAGE:
 * stepOutputNameContract.parse('g');
 * // Returns a branded StepOutputName
 */

import { z } from 'zod';

export const stepOutputNameContract = z.string().min(1).brand<'StepOutputName'>();

export type StepOutputName = z.infer<typeof stepOutputNameContract>;
