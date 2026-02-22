/**
 * PURPOSE: Defines a branded string type for function parameter names
 *
 * USAGE:
 * const param: ParameterName = parameterNameContract.parse('input');
 * // Returns a branded ParameterName string type
 */
import { z } from 'zod';

export const parameterNameContract = z.string().brand<'ParameterName'>();

export type ParameterName = z.infer<typeof parameterNameContract>;
