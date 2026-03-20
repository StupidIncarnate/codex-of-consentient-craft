/**
 * PURPOSE: Defines a branded non-negative integer type for topological depth of work items in dependency chains
 *
 * USAGE:
 * topologicalDepthContract.parse(0);
 * // Returns: TopologicalDepth branded number
 */

import { z } from 'zod';

export const topologicalDepthContract = z.number().int().nonnegative().brand<'TopologicalDepth'>();

export type TopologicalDepth = z.infer<typeof topologicalDepthContract>;
