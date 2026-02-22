/**
 * PURPOSE: Defines a branded string type for function return type names
 *
 * USAGE:
 * const returnType: ReturnType = returnTypeContract.parse('Promise<void>');
 * // Returns a branded ReturnType string type
 */
import { z } from 'zod';

export const returnTypeContract = z.string().brand<'ReturnType'>();

export type ReturnType = z.infer<typeof returnTypeContract>;
