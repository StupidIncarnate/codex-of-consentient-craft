/**
 * PURPOSE: Validates TypeScript Statement for AST transformers
 *
 * USAGE:
 * import type { TypescriptStatement } from './typescript-statement-contract';
 * // Use as opaque type passed between adapters
 */

import { z } from 'zod';

export const typescriptStatementContract = z.unknown().brand<'TypescriptStatement'>();

export type TypescriptStatement = z.infer<typeof typescriptStatementContract>;
