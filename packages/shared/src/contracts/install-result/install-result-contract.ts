/**
 * PURPOSE: Zod schema for validating install operation results
 *
 * USAGE:
 * const result = installResultContract.parse({
 *   packageName: '@dungeonmaster/eslint' as PackageName,
 *   success: true,
 *   action: 'created',
 *   message: 'Package installed successfully' as InstallMessage
 * });
 * // Returns typed InstallResult with package name, success status, action, and optional message/error
 */

import { z } from '#gateway/npm/zod';
import { installActionContract } from '../install-action/install-action-contract';
import { installMessageContract } from '../install-message/install-message-contract';

/**
 * Represents the result of an install operation
 * Contains package name, success status, action taken, and optional message/error details
 */
export const installResultContract = z.object({
  packageName: z.string().min(1).brand<'InstallResultPackageName'>(),
  success: z.boolean(),
  action: installActionContract,
  message: installMessageContract.optional(),
  error: z.string().brand<'InstallResultError'>().optional(),
});

export type InstallResult = z.infer<typeof installResultContract>;
