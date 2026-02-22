/**
 * PURPOSE: Defines a branded string type for TypeScript type names
 *
 * USAGE:
 * const typeName: TypeName = typeNameContract.parse('string');
 * // Returns a branded TypeName string type
 */
import { z } from 'zod';

export const typeNameContract = z.string().brand<'TypeName'>();

export type TypeName = z.infer<typeof typeNameContract>;
