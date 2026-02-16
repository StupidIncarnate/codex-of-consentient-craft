/**
 * PURPOSE: Defines a branded string type for file types like 'broker', 'guard', 'transformer'
 *
 * USAGE:
 * const type: FileType = fileTypeContract.parse('broker');
 * // Returns a branded FileType string type
 */
import { z } from 'zod';

export const fileTypeContract = z.string().brand<'FileType'>();

export type FileType = z.infer<typeof fileTypeContract>;
