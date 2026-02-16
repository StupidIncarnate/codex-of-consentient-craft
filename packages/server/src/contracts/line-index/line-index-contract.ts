/**
 * PURPOSE: Defines a branded non-negative integer type for line indices in files
 *
 * USAGE:
 * const index: LineIndex = lineIndexContract.parse(0);
 * // Returns a branded LineIndex integer (0 or positive)
 */
import { z } from 'zod';

export const lineIndexContract = z.number().int().min(0).brand<'LineIndex'>();

export type LineIndex = z.infer<typeof lineIndexContract>;
