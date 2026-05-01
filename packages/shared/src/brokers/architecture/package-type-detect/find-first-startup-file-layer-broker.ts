/**
 * PURPOSE: Finds the name of the first startup file (start-*.ts) in a package's startup directory
 *
 * USAGE:
 * const name = findFirstStartupFileLayerBroker({ startupDirPath: absoluteFilePathContract.parse('/project/src/startup') });
 * // Returns 'start-my-app.ts' as FileName or undefined if no matching file found
 *
 * WHEN-TO-USE: During package-type detection to locate the startup file for content inspection
 */

import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import { fileNameContract } from '../../../contracts/file-name/file-name-contract';
import type { FileName } from '../../../contracts/file-name/file-name-contract';
import { matchesStartupFileNameGuard } from '../../../guards/matches-startup-file-name/matches-startup-file-name-guard';
import { safeReaddirLayerBroker } from './safe-readdir-layer-broker';

export const findFirstStartupFileLayerBroker = ({
  startupDirPath,
}: {
  startupDirPath: AbsoluteFilePath;
}): FileName | undefined => {
  const entries = safeReaddirLayerBroker({ dirPath: startupDirPath });
  const match = entries.find(
    (entry) => !entry.isDirectory() && matchesStartupFileNameGuard({ name: entry.name }),
  );
  if (match === undefined) return undefined;
  return fileNameContract.parse(match.name);
};
