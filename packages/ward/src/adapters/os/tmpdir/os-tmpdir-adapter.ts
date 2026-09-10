/**
 * PURPOSE: Answers where this machine keeps scratch files. Reach for this rather than writing a
 * run's scratch file into the package being checked: ward grades UNTRACKED files on `--uncommitted`,
 * so a scratch file left in the repo by a killed run becomes a file the next run tries to lint.
 *
 * USAGE:
 * osTmpdirAdapter();
 * // Returns the OS scratch directory, e.g. '/tmp'
 */

import { tmpdir } from 'os';
import { absoluteFilePathContract } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

export const osTmpdirAdapter = (): AbsoluteFilePath => absoluteFilePathContract.parse(tmpdir());
