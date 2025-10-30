/**
 * PURPOSE: Defines a branded string type for source code content with validation.
 *
 * USAGE:
 * const sourceCode = sourceCodeContract.parse('const x = 1;');
 * // Returns: SourceCode (branded string)
 */
import { z } from 'zod';

export const sourceCodeContract = z.string().brand<'SourceCode'>();

export type SourceCode = z.infer<typeof sourceCodeContract>;
