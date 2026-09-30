/**
 * PURPOSE: Lists the immediate subfolders of a directory as absolute paths, for walking a
 * workspace's `packages/` folder one level at a time.
 *
 * USAGE:
 * subfolderPathsListLayerBroker({ dirPath: absoluteFilePathContract.parse('/repo/packages') });
 * // Returns ['/repo/packages/shared', '/repo/packages/@gateway', ...]
 */
import { readdirEntriesSync } from '#gateway/node/fs';

export const subfolderPathsListLayerBroker = ({ dirPath }: { dirPath: string }): string[] =>
  readdirEntriesSync(dirPath)
    .filter((entry) => entry.kind === 'directory')
    .map((entry) => `${dirPath}/${entry.name}`);
