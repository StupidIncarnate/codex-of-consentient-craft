/**
 * PURPOSE: Validates TypeScript Program for AST transformers
 *
 * USAGE:
 * import type { TypescriptProgram } from './typescript-program-contract';
 * // Use as opaque type passed between adapters
 */

import { z } from 'zod';

export const typescriptProgramContract = z.unknown().brand<'TypescriptProgram'>();

export type TypescriptProgram = z.infer<typeof typescriptProgramContract>;
