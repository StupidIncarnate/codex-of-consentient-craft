/**
 * PURPOSE: Zod schema for an absolute path to the repo root cwd (directory containing .dungeonmaster.json)
 *
 * USAGE:
 * const cwd = repoRootCwdContract.parse('/home/user/project');
 * // Returns branded RepoRootCwd type — only obtainable via cwdResolveBroker or this contract's parse
 */

import { absoluteFilePathContract } from '../absolute-file-path/absolute-file-path-contract';
import type { z } from 'zod';

export const repoRootCwdContract = absoluteFilePathContract.brand<'RepoRootCwd'>();

export type RepoRootCwd = z.infer<typeof repoRootCwdContract>;
