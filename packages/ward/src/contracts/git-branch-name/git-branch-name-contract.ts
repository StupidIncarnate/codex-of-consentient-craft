/**
 * PURPOSE: Zod schema for validating git branch names
 *
 * USAGE:
 * const branch = gitBranchNameContract.parse('main');
 * // Returns branded GitBranchName type for git branch names
 */

import { z } from 'zod';

export const gitBranchNameContract = z.string().min(1).brand<'GitBranchName'>();

export type GitBranchName = z.infer<typeof gitBranchNameContract>;
