/**
 * PURPOSE: Answers where this machine keeps scratch files. Reach for this rather than writing a
 * run's scratch file into the package being checked: ward grades UNTRACKED files on `--uncommitted`,
 * so a scratch file left in the repo by a killed run becomes a file the next run tries to lint.
 *
 * USAGE:
 * tmpdirFindBroker();
 * // Returns the OS scratch directory, e.g. '/tmp'
 */

import { tmpdir } from '#gateway/node/os';

export const tmpdirFindBroker = (): string => tmpdir();
