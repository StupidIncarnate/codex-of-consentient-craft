import { z } from 'zod';

/**
 * Represents an error or validation message string
 * Used for error messages, lint suggestions, and user-facing messages
 */
export const errorMessageContract = z.string().brand<'ErrorMessage'>();

export type ErrorMessage = z.infer<typeof errorMessageContract>;
