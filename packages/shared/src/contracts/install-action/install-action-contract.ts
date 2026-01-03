/**
 * PURPOSE: Zod schema for validating install action types
 *
 * USAGE:
 * const action = installActionContract.parse('created');
 * // Returns branded InstallAction enum type for install operation results
 */

import { z } from 'zod';

/**
 * Represents the action taken during an install operation
 * - created: New files/configuration was created
 * - merged: Existing files were merged with new content
 * - skipped: Installation was skipped (already exists or not needed)
 * - failed: Installation failed with an error
 */
export const installActionContract = z.enum(['created', 'merged', 'skipped', 'failed']);

export type InstallAction = z.infer<typeof installActionContract>;
