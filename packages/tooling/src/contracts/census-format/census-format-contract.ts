/**
 * PURPOSE: Names how the census prints its result: a short human table or the full JSON document.
 *
 * USAGE:
 * censusFormatContract.parse('table');
 * // Returns: CensusFormat
 */
import { z } from '#gateway/npm/zod';

export const censusFormatContract = z.enum(['table', 'json']);

export type CensusFormat = z.infer<typeof censusFormatContract>;
