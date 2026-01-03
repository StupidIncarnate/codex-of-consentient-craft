/**
 * PURPOSE: Zod schema for validating install operation context
 *
 * USAGE:
 * const context = installContextContract.parse({
 *   targetProjectRoot: '/home/user/project' as FilePath,
 *   dungeonmasterRoot: '/home/user/.dungeonmaster' as FilePath
 * });
 * // Returns typed InstallContext with project and dungeonmaster root paths
 */

import { z } from 'zod';
import { filePathContract } from '../file-path/file-path-contract';

/**
 * Represents the context for an install operation
 * Contains the target project root and dungeonmaster installation root
 */
export const installContextContract = z.object({
  targetProjectRoot: filePathContract,
  dungeonmasterRoot: filePathContract,
});

export type InstallContext = z.infer<typeof installContextContract>;
