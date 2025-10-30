/**
 * PURPOSE: Defines a report structure for duplicate literal values with their occurrences and metadata.
 *
 * USAGE:
 * const report = duplicateLiteralReportContract.parse({ value: 'text', type: 'string', occurrences: [...], count: 5 });
 * // Returns: DuplicateLiteralReport (object with value, type, occurrences array, and count)
 */
import { z } from 'zod';
import { literalValueContract } from '../literal-value/literal-value-contract';
import { literalTypeContract } from '../literal-type/literal-type-contract';
import { literalOccurrenceContract } from '../literal-occurrence/literal-occurrence-contract';
import { occurrenceCountStatics } from '../../statics/occurrence-count/occurrence-count-statics';

export const duplicateLiteralReportContract = z.object({
  value: literalValueContract,
  type: literalTypeContract,
  occurrences: z.array(literalOccurrenceContract),
  count: z
    .number()
    .int()
    .min(occurrenceCountStatics.minimumForDuplicate)
    .brand<'OccurrenceCount'>(),
});

export type DuplicateLiteralReport = z.infer<typeof duplicateLiteralReportContract>;
