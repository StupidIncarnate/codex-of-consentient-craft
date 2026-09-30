/**
 * PURPOSE: Builds a valid HookWorktreeCreateResult for tests
 *
 * USAGE:
 * HookWorktreeCreateResultStub();
 * // Returns a valid HookWorktreeCreateResult
 */
import type { StubArgument } from '@dungeonmaster/shared/@types';

import { hookWorktreeCreateResultContract } from './hook-worktree-create-result-contract';
import type { HookWorktreeCreateResult } from './hook-worktree-create-result-contract';

export const HookWorktreeCreateResultStub = ({
  ...props
}: StubArgument<HookWorktreeCreateResult> = {}): HookWorktreeCreateResult =>
  hookWorktreeCreateResultContract.parse({ stderr: 'sample', exitCode: 0, ...props });
