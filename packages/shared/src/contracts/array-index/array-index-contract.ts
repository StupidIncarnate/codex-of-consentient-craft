/**
 * PURPOSE: Defines a branded number type for array index positions
 *
 * USAGE:
 * const idx: ArrayIndex = arrayIndexContract.parse(0);
 * // Returns a branded ArrayIndex number type for nonnegative integer positions
 */
import { z } from 'zod';

export const arrayIndexContract = z.number().int().nonnegative().brand<'ArrayIndex'>();

export type ArrayIndex = z.infer<typeof arrayIndexContract>;
