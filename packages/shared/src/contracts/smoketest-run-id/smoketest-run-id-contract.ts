/**
 * PURPOSE: Defines the branded UUID type for a smoketest run identifier (shared so server+web can type it)
 *
 * USAGE:
 * smoketestRunIdContract.parse('f47ac10b-58cc-4372-a567-0e02b2c3d479');
 * // Returns: SmoketestRunId branded string
 */

import { z } from '#gateway/npm/zod';

export const smoketestRunIdContract = z.uuid().brand<'SmoketestRunId'>();

export type SmoketestRunId = z.infer<typeof smoketestRunIdContract>;
