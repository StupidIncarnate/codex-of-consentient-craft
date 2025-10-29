import { z } from 'zod';

/**
 * Represents a folder depth count (non-negative integer)
 * Used for tracking directory nesting levels in file paths
 *
 * PURPOSE: Validates non-negative integer values representing folder depth/nesting levels
 *
 * USAGE:
 * const depth = depthCountContract.parse(3);
 * // Returns branded DepthCount; throws on negative numbers or non-integers
 */
export const depthCountContract = z.number().int().nonnegative().brand<'DepthCount'>();

export type DepthCount = z.infer<typeof depthCountContract>;
