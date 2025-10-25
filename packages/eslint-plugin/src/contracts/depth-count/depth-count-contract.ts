import { z } from 'zod';

/**
 * Represents a folder depth count (non-negative integer)
 * Used for tracking directory nesting levels in file paths
 */
export const depthCountContract = z.number().int().nonnegative().brand<'DepthCount'>();

export type DepthCount = z.infer<typeof depthCountContract>;
