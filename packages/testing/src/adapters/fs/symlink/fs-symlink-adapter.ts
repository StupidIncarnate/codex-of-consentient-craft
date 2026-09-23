/**
 * PURPOSE: Creates a symlink on disk pointing at the given target — lets an integration test
 * pre-seed a symlink an install path must discover and react to (a legacy link left by a prior
 * install), which fsWriteFileAdapter cannot produce since it always creates a real file.
 *
 * USAGE:
 * fsSymlinkAdapter({targetPath: '/tmp/target-dir', linkPath: '/tmp/test-project/.legacy-link'});
 * // Creates the symlink at linkPath, pointing at targetPath
 */

import { symlinkSync } from 'fs';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

export const fsSymlinkAdapter = ({
  targetPath,
  linkPath,
}: {
  targetPath: string;
  linkPath: string;
}): AdapterResult => {
  symlinkSync(targetPath, linkPath, 'dir');

  return { success: true as const };
};
