/**
 * PURPOSE: Defines the branded UUID type for DependencyStep identifiers
 *
 * USAGE:
 * stepIdContract.parse('e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b');
 * // Returns: StepId branded string
 */

import { z } from 'zod';

export const stepIdContract = z.string().uuid().brand<'StepId'>();

export type StepId = z.infer<typeof stepIdContract>;
