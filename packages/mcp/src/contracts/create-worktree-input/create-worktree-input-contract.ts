/**
 * PURPOSE: Validates input for the create-worktree MCP tool
 *
 * USAGE:
 * createWorktreeInputContract.parse({ name: 'probe' });
 * // Returns: CreateWorktreeInput naming the worktree to carve or re-use
 *
 * `name` is the ONLY argument, and that is the design rather than a simplification: the directory
 * name doubles as the branch name, so a worktree is discoverable from its branch and back again
 * without reading anything, and the caller never gets to choose a path outside `worktrees/`.
 */

import { z } from 'zod';

export const createWorktreeInputContract = z
  .object({
    name: z
      .string()
      .min(1)
      .describe(
        'Directory name under worktrees/, which doubles as the branch name. Asking again for a name that already exists hands back the same tree',
      )
      .brand<'WorktreeName'>(),
  })
  .strict()
  .brand<'CreateWorktreeInput'>();

export type CreateWorktreeInput = z.infer<typeof createWorktreeInputContract>;
