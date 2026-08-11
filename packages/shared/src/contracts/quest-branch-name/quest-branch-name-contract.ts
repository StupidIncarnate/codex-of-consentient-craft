/**
 * PURPOSE: Identifies the quest's own working branch by name. Reach for baseBranchNameContract
 * instead when the value must be constrained to the local main/master fork point rather than the
 * quest's branch.
 *
 * USAGE:
 * questBranchNameContract.parse('quest/git-lifecycle-7bc217a1');
 * // Returns: QuestBranchName branded string
 */

import { z } from 'zod';

export const questBranchNameContract = z.string().min(1).brand<'QuestBranchName'>();

export type QuestBranchName = z.infer<typeof questBranchNameContract>;
