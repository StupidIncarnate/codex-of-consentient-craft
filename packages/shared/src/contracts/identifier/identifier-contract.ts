import { z } from 'zod';

/**
 * Represents a JavaScript/TypeScript identifier (variable name, function name, etc.)
 * Used for AST node names, import names, and other identifiers in code
 */
export const identifierContract = z.string().brand<'Identifier'>();

export type Identifier = z.infer<typeof identifierContract>;
