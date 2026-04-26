/**
 * PURPOSE: Validates the metadata.json shape written by mock queue harnesses to persist the queue counter
 *
 * USAGE:
 * const metadata = queueMetadataContract.parse(JSON.parse(raw));
 * // Returns validated QueueMetadata with a numeric counter
 */

import { z } from 'zod';

export const queueMetadataContract = z
  .object({
    counter: z.number().int().nonnegative(),
  })
  .brand<'QueueMetadata'>();

export type QueueMetadata = z.infer<typeof queueMetadataContract>;
