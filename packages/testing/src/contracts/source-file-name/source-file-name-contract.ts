/**
 * PURPOSE: Validates TypeScript source file names for AST transformers
 *
 * USAGE:
 * sourceFileNameContract.parse('myfile.test.ts');
 * // Returns validated SourceFileName branded type
 */

import { z } from 'zod';

export const sourceFileNameContract = z.string().min(1).brand<'SourceFileName'>();

export type SourceFileName = z.infer<typeof sourceFileNameContract>;
