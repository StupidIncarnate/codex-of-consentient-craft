/**
 * PURPOSE: Defines a branded string type for literal values with validation.
 *
 * USAGE:
 * const value = literalValueContract.parse('some string');
 * // Returns: LiteralValue (branded string)
 */
import { z } from 'zod';

export const literalValueContract = z.string().brand<'LiteralValue'>();

export type LiteralValue = z.infer<typeof literalValueContract>;
