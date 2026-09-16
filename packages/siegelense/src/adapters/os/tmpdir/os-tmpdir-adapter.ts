/**
 * PURPOSE: Answers where this machine keeps scratch files — the base `locationsSocketPathFindBroker`
 * joins its socket directory onto. The AF_UNIX path-length ceiling (108 bytes on Linux) is why a
 * driver's socket lives here rather than under the siegelense root: a repo checked out several
 * directories deep would otherwise blow the ceiling on every instance.
 *
 * USAGE:
 * osTmpdirAdapter();
 * // Returns the OS scratch directory, e.g. '/tmp'
 */

import { tmpdir } from 'os';
import { absoluteFilePathContract } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

export const osTmpdirAdapter = (): AbsoluteFilePath => absoluteFilePathContract.parse(tmpdir());
