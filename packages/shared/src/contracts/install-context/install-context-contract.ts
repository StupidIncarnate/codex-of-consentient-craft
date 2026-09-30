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

import { z } from '#gateway/npm/zod';
import { relativeFilePathContract } from '../relative-file-path/relative-file-path-contract';

/**
 * Represents the context for an install operation
 * Contains the target project root and dungeonmaster installation root
 */
export const installContextContract = z
  .object({
    targetProjectRoot: z
      .union([
        z
          .string()
          .min(1)
          .refine(
            (path) => {
              if (path.startsWith('/')) {
                return true;
              }
              if (/^[A-Za-z]:\\/u.test(path)) {
                return true;
              }
              return false;
            },
            { message: 'Path must be absolute (start with / or C:\\ on Windows)' },
          )
          .brand<'InstallContextTargetProjectRoot'>(),
        relativeFilePathContract,
      ])
      .brand<'InstallContextTargetProjectRoot'>(),
    dungeonmasterRoot: z
      .union([
        z
          .string()
          .min(1)
          .refine(
            (path) => {
              if (path.startsWith('/')) {
                return true;
              }
              if (/^[A-Za-z]:\\/u.test(path)) {
                return true;
              }
              return false;
            },
            { message: 'Path must be absolute (start with / or C:\\ on Windows)' },
          )
          .brand<'InstallContextDungeonmasterRoot'>(),
        relativeFilePathContract,
      ])
      .brand<'InstallContextDungeonmasterRoot'>(),
  })
  .brand<'InstallContext'>();

export type InstallContext = z.infer<typeof installContextContract>;
