/**
 * PURPOSE: Zod schema for validating JavaScript/TypeScript identifiers
 *
 * USAGE:
 * const name = identifierContract.parse('myFunction');
 * // Returns branded Identifier type for variable names, function names, etc.
 */

import { z } from 'zod';

/**
 * Represents a JavaScript/TypeScript identifier (variable name, function name, etc.)
 * Used for AST node names, import names, and other identifiers in code
 */
export const identifierContract = z.string().brand<'Identifier'>();

export type Identifier = z.infer<typeof identifierContract>;
