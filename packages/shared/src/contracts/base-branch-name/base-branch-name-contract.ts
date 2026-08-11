/**
 * PURPOSE: Reach for this over questBranchNameContract when the value must be one of the local
 * branch names Start probes as a merge target — main or master — rather than the quest's own
 * working branch.
 *
 * USAGE:
 * baseBranchNameContract.parse('main');
 * // Returns: 'main' as BaseBranchName
 */

import { z } from 'zod';

import { baseBranchStatics } from '../../statics/base-branch/base-branch-statics';

export const baseBranchNameContract = z
  .enum(baseBranchStatics.candidates)
  .brand<'BaseBranchName'>();

export type BaseBranchName = z.infer<typeof baseBranchNameContract>;
