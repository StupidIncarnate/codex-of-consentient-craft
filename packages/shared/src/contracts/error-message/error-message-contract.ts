/**
 * PURPOSE: Zod schema for validating error and validation message strings
 *
 * USAGE:
 * const message = errorMessageContract.parse('File not found');
 * // Returns branded ErrorMessage type for error messages and user-facing text
 */

import { z } from 'zod';

/**
 * Represents an error or validation message string
 * Used for error messages, lint suggestions, and user-facing messages
 */
export const errorMessageContract = z.string().brand<'ErrorMessage'>();

export type ErrorMessage = z.infer<typeof errorMessageContract>;
