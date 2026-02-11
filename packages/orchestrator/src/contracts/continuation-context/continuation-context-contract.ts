/**
 * PURPOSE: Defines a branded string type for continuation context passed to respawned agents
 *
 * USAGE:
 * continuationContextContract.parse('Continue from step 2');
 * // Returns branded ContinuationContext string
 */

import { z } from 'zod';

export const continuationContextContract = z.string().min(1).brand<'ContinuationContext'>();

export type ContinuationContext = z.infer<typeof continuationContextContract>;
