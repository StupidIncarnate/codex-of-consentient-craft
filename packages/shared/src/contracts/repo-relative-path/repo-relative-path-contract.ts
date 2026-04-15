/**
 * PURPOSE: Zod schema for validating repo-relative file paths (no absolute prefix, no drive letter)
 *
 * USAGE:
 * const path = repoRelativePathContract.parse('packages/shared/src/contracts/quest/quest-contract.ts');
 * // Returns branded RepoRelativePath type that rejects absolute paths to keep persisted quest data portable
 */

import { z } from 'zod';

export const repoRelativePathContract = z
  .string()
  .min(1)
  .refine(
    (path) => {
      if (path.startsWith('/')) {
        return false;
      }
      if (/^[A-Za-z]:\\/u.test(path)) {
        return false;
      }
      return true;
    },
    {
      message: 'Path must be repo-relative (not absolute)',
    },
  )
  .brand<'RepoRelativePath'>();

export type RepoRelativePath = z.infer<typeof repoRelativePathContract>;
