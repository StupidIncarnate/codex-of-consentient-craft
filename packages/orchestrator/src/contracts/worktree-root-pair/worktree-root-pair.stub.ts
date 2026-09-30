/**
 * PURPOSE: Builds a valid WorktreeRootPair for tests
 *
 * USAGE:
 * WorktreeRootPairStub();
 * // Returns a valid WorktreeRootPair
 */

import { worktreeRootPairContract } from './worktree-root-pair-contract';
import type { WorktreeRootPair } from './worktree-root-pair-contract';

export const WorktreeRootPairStub = (): WorktreeRootPair =>
  worktreeRootPairContract.parse({ sourceRoot: 'sample', targetRoot: 'sample' });
