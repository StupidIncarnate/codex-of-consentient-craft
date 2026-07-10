/**
 * PURPOSE: Defines a branded string type for execution floor names
 *
 * USAGE:
 * floorNameContract.parse('CARTOGRAPHY');
 * // Returns: FloorName branded string
 */

import { z } from 'zod';

export const floorNameContract = z.string().min(1).brand<'FloorName'>();

export type FloorName = z.infer<typeof floorNameContract>;
