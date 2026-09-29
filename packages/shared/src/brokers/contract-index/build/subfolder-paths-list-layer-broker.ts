/**
 * PURPOSE: Lists the immediate subfolders of a directory as absolute paths, for walking a
 * workspace's `packages/` folder one level at a time.
 *
 * USAGE:
 * subfolderPathsListLayerBroker({ dirPath: absoluteFilePathContract.parse('/repo/packages') });
 * // Returns ['/repo/packages/shared', '/repo/packages/@gateway', ...]
 */
import { readdirEntriesSync } from '#gateway/node/fs';

import {
  absoluteFilePathContract,
  type AbsoluteFilePath,
} from '../../../contracts/absolute-file-path/absolute-file-path-contract';

export const subfolderPathsListLayerBroker = ({
  dirPath,
}: {
  dirPath: AbsoluteFilePath;
}): AbsoluteFilePath[] =>
  readdirEntriesSync(dirPath)
    .filter((entry) => entry.kind === 'directory')
    .map((entry) => absoluteFilePathContract.parse(`${dirPath}/${entry.name}`));
