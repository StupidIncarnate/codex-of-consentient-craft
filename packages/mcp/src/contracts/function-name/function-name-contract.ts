/**
 * PURPOSE: Defines a branded string type for function or file names
 *
 * USAGE:
 * const name: FunctionName = functionNameContract.parse('myBroker');
 * // Returns a branded FunctionName string type
 */
import { z } from 'zod';

export const functionNameContract = z.string().brand<'FunctionName'>();

export type FunctionName = z.infer<typeof functionNameContract>;
