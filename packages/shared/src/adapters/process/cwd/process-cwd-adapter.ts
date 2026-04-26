/**
 * PURPOSE: Wraps process.cwd() to return a branded FilePath type. This is the
 * SOLE legitimate process.cwd() call site in the codebase outside of
 * start-install.ts (where the user's invocation directory is the deliberate
 * install target). All other code that needs a cwd seed must call this
 * adapter and feed the result into a path-resolver broker (e.g.
 * configRootFindBroker) so cwd is treated as a walk-up seed, never as a
 * trusted target.
 *
 * USAGE:
 * const cwd = processCwdAdapter();
 * // Returns FilePath branded type, e.g. '/home/user/project'
 */

import { cwd } from 'process';
import { filePathContract, type FilePath } from '../../../contracts/file-path/file-path-contract';

export const processCwdAdapter = (): FilePath => filePathContract.parse(cwd());
