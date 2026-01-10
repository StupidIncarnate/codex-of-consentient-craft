/**
 * PURPOSE: Defines a branded non-negative integer type for menu selection indices
 *
 * USAGE:
 * const index: MenuIndex = menuIndexContract.parse(0);
 * // Returns a branded MenuIndex integer (0 or positive)
 */
import { z } from 'zod';

export const menuIndexContract = z.number().int().min(0).brand<'MenuIndex'>();

export type MenuIndex = z.infer<typeof menuIndexContract>;
