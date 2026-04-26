/**
 * PURPOSE: Zod schema for an absolute path to a project root cwd (nearest directory containing package.json)
 *
 * USAGE:
 * const cwd = projectRootCwdContract.parse('/home/user/project/packages/web');
 * // Returns branded ProjectRootCwd type — only obtainable via cwdResolveBroker or this contract's parse
 */

import { absoluteFilePathContract } from '../absolute-file-path/absolute-file-path-contract';
import type { z } from 'zod';

export const projectRootCwdContract = absoluteFilePathContract.brand<'ProjectRootCwd'>();

export type ProjectRootCwd = z.infer<typeof projectRootCwdContract>;
