/**
 * PURPOSE: A count the census reports, always a whole number from zero, so a total cannot go
 * negative or fractional by way of a bad subtraction.
 *
 * USAGE:
 * censusCountContract.parse(3);
 * // Returns: CensusCount (branded number)
 */
import { z } from 'zod';

export const censusCountContract = z.number().int().min(0).brand<'CensusCount'>();

export type CensusCount = z.infer<typeof censusCountContract>;
