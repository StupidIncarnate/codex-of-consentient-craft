/**
 * PURPOSE: Defines a branded number type for line count values
 *
 * USAGE:
 * const lines: LineCount = lineCountContract.parse(500);
 * // Returns a branded LineCount number type
 */
import { z } from 'zod';

export const lineCountContract = z.number().int().positive().brand<'LineCount'>();

export type LineCount = z.infer<typeof lineCountContract>;
