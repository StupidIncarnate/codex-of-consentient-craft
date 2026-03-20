/**
 * PURPOSE: Defines a branded string key for grouping work items by depth and floor name
 *
 * USAGE:
 * floorGroupKeyContract.parse('0:HOMEBASE');
 * // Returns: FloorGroupKey branded string
 */

import { z } from 'zod';

export const floorGroupKeyContract = z.string().min(1).brand<'FloorGroupKey'>();

export type FloorGroupKey = z.infer<typeof floorGroupKeyContract>;
