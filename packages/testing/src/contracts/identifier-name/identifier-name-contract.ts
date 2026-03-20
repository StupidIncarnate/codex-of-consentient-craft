/**
 * PURPOSE: Validates JavaScript/TypeScript identifier names extracted from AST
 *
 * USAGE:
 * identifierNameContract.parse('execFile');
 * // Returns validated IdentifierName branded type
 */

import { z } from 'zod';

export const identifierNameContract = z.string().min(1).brand<'IdentifierName'>();

export type IdentifierName = z.infer<typeof identifierNameContract>;
