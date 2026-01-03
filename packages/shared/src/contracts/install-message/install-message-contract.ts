/**
 * PURPOSE: Zod schema for validating install operation messages
 *
 * USAGE:
 * const message = installMessageContract.parse('Package installed successfully');
 * // Returns branded InstallMessage type for install status messages
 */

import { z } from 'zod';

/**
 * Represents a message about an install operation
 * Used for success messages, error details, and status updates during package installation
 */
export const installMessageContract = z.string().min(1).brand<'InstallMessage'>();

export type InstallMessage = z.infer<typeof installMessageContract>;
