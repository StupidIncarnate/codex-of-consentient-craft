/**
 * PURPOSE: Per-work-item-status metadata schema capturing every flag read by work-item-status guards
 *
 * USAGE:
 * const metadata = workItemStatusMetadataContract.parse({...});
 * // Returns a validated WorkItemStatusMetadata object
 */

import { z } from 'zod';

export const workItemStatusMetadataContract = z.object({
  isTerminal: z.boolean(),
  satisfiesDependency: z.boolean(),
  isActive: z.boolean(),
  isPending: z.boolean(),
  isComplete: z.boolean(),
  isSkipped: z.boolean(),
  isFailure: z.boolean(),
});

export type WorkItemStatusMetadata = z.infer<typeof workItemStatusMetadataContract>;
