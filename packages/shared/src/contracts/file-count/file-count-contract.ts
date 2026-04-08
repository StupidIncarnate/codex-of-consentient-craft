/**
 * PURPOSE: Defines a branded number type for file count values
 *
 * USAGE:
 * const count: FileCount = fileCountContract.parse(42);
 * // Returns a branded FileCount number type
 */
import { z } from 'zod';

export const fileCountContract = z.number().int().nonnegative().brand<'FileCount'>();

export type FileCount = z.infer<typeof fileCountContract>;
