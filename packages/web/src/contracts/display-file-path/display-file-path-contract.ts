/**
 * PURPOSE: Defines a branded string type for file paths displayed in the execution view
 *
 * USAGE:
 * displayFilePathContract.parse('src/auth.ts');
 * // Returns: DisplayFilePath branded string
 */

import { z } from 'zod';

export const displayFilePathContract = z.string().min(1).brand<'DisplayFilePath'>();

export type DisplayFilePath = z.infer<typeof displayFilePathContract>;
