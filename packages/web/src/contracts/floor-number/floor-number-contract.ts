/**
 * PURPOSE: Defines a branded positive integer type for execution floor numbers
 *
 * USAGE:
 * floorNumberContract.parse(1);
 * // Returns: FloorNumber branded number
 */

import { z } from 'zod';

export const floorNumberContract = z.number().int().positive().brand<'FloorNumber'>();

export type FloorNumber = z.infer<typeof floorNumberContract>;
