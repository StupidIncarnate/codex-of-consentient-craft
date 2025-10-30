/**
 * PURPOSE: Defines a branded string type for error messages
 *
 * USAGE:
 * const message: ErrorMessage = errorMessageContract.parse('Invalid request');
 * // Returns a branded ErrorMessage string type
 */
import { z } from 'zod';

export const errorMessageContract = z.string().brand<'ErrorMessage'>();

export type ErrorMessage = z.infer<typeof errorMessageContract>;
