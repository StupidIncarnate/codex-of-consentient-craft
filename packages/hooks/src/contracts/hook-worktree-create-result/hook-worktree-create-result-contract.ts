/**
 * PURPOSE: Defines the data `HookWorktreeCreateResponder` returns
 *
 * USAGE:
 * hookWorktreeCreateResultContract.parse(value);
 * // Returns validated HookWorktreeCreateResult
 */
import { z } from '#gateway/npm/zod';

export const hookWorktreeCreateResultContract = z
  .object({
    stderr: z.string().brand<'HookWorktreeCreateResultStderr'>(),
    exitCode: z.number().brand<'HookWorktreeCreateResultExitCode'>(),
  })
  .brand<'HookWorktreeCreateResult'>();

export type HookWorktreeCreateResult = z.infer<typeof hookWorktreeCreateResultContract>;
