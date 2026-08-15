/**
 * PURPOSE: Branded string for work item relatedDataItems references with regex validation
 *
 * USAGE:
 * relatedDataItemContract.parse('operations/f47ac10b-58cc-4372-a567-0e02b2c3d479');
 * // Returns: RelatedDataItem branded string
 *
 * WHEN-TO-USE: For referencing quest-level data from work items
 * WHEN-NOT-TO-USE: For direct quest property access without work item indirection
 */

import { z } from 'zod';

// The alternation is an ALLOWLIST of quest collections a work item may point into, so a collection
// missing from it cannot be referenced at all — `questContract.parse` rejects the whole quest rather
// than dropping the ref, in production and in stubs alike. Adding a results collection to the quest
// therefore means adding it here too, or nothing can ever link to it.
export const relatedDataItemContract = z
  .string()
  .regex(
    /^(operations|wardResults|riftcarverResults|flows)\/[a-z0-9-]+$/u,
    'Must be {collection}/{id}',
  )
  .brand<'RelatedDataItem'>();

export type RelatedDataItem = z.infer<typeof relatedDataItemContract>;
