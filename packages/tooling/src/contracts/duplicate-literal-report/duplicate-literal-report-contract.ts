/**
 * PURPOSE: Defines a report structure for duplicate literal values with their occurrences and metadata.
 *
 * USAGE:
 * const report = duplicateLiteralReportContract.parse({ value: 'text', type: 'string', occurrences: [...], count: 5 });
 * // Returns: DuplicateLiteralReport (object with value, type, occurrences array, and count)
 */
import { z } from '#gateway/npm/zod';
import { literalTypeContract } from '../literal-type/literal-type-contract';
import { literalOccurrenceContract } from '../literal-occurrence/literal-occurrence-contract';
import { occurrenceCountStatics } from '../../statics/occurrence-count/occurrence-count-statics';

export const duplicateLiteralReportContract = z
  .object({
    value: z.string().brand<'DuplicateLiteralReportValue'>(),
    type: literalTypeContract,
    occurrences: z.array(literalOccurrenceContract),
    count: z
      .number()
      .int()
      .min(occurrenceCountStatics.minimumForDuplicate)
      .brand<'DuplicateLiteralReportCount'>(),
  })
  .brand<'DuplicateLiteralReport'>();

export type DuplicateLiteralReport = z.infer<typeof duplicateLiteralReportContract>;
