/**
 * PURPOSE: Branded string for work item relatedDataItems references with regex validation
 *
 * USAGE:
 * relatedDataItemContract.parse('steps/f47ac10b-58cc-4372-a567-0e02b2c3d479');
 * // Returns: RelatedDataItem branded string
 *
 * WHEN-TO-USE: For referencing quest-level data from work items
 * WHEN-NOT-TO-USE: For direct quest property access without work item indirection
 */

import { z } from 'zod';

export const relatedDataItemContract = z
  .string()
  .regex(/^(steps|wardResults)\/[a-f0-9-]+$/u, 'Must be {collection}/{uuid}')
  .brand<'RelatedDataItem'>();

export type RelatedDataItem = z.infer<typeof relatedDataItemContract>;
