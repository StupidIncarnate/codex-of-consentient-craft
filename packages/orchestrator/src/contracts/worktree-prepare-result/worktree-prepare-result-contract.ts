/**
 * PURPOSE: Defines the data `worktreePrepareBroker` returns
 *
 * USAGE:
 * worktreePrepareResultContract.parse(value);
 * // Returns validated WorktreePrepareResult
 */
import { z } from '#gateway/npm/zod';
import { questContract } from '@dungeonmaster/shared/contracts';

export const worktreePrepareResultContract = z
  .object({ baseRef: questContract.shape.baseRef.unwrap() })
  .brand<'WorktreePrepareResult'>();

export type WorktreePrepareResult = z.infer<typeof worktreePrepareResultContract>;
