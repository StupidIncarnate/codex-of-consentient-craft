/**
 * PURPOSE: Defines an enumeration type for literal types (string or regex).
 *
 * USAGE:
 * const type = literalTypeContract.parse('string');
 * // Returns: LiteralType ('string' or 'regex')
 */
import { z } from 'zod';

export const literalTypeContract = z.enum(['string', 'regex']).brand<'LiteralType'>();

export type LiteralType = z.infer<typeof literalTypeContract>;
