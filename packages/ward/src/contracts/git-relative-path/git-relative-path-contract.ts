/**
 * PURPOSE: Zod schema for validating relative file paths from git diff output
 *
 * USAGE:
 * const path = gitRelativePathContract.parse('src/utils.ts');
 * // Returns branded GitRelativePath type for git-relative paths
 */

import { z } from 'zod';

export const gitRelativePathContract = z.string().min(1).brand<'GitRelativePath'>();

export type GitRelativePath = z.infer<typeof gitRelativePathContract>;
