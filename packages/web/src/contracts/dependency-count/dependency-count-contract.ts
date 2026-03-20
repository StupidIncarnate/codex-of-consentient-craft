/**
 * PURPOSE: Defines a branded non-negative integer type for counting in-degree dependencies of work items
 *
 * USAGE:
 * dependencyCountContract.parse(3);
 * // Returns: DependencyCount branded number
 */

import { z } from 'zod';

export const dependencyCountContract = z.number().int().nonnegative().brand<'DependencyCount'>();

export type DependencyCount = z.infer<typeof dependencyCountContract>;
