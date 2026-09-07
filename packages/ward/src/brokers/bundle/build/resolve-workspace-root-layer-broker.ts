/**
 * PURPOSE: Finds the directory a monorepo's workspaces are declared in, walking up from a package.
 * The bundle hash spans every workspace package the bundled one depends on, and a child ward runs
 * with its cwd set to ONE package — so the package's own root is the only thing on hand, and it is
 * not where the workspace list or the lockfile live.
 *
 * `workspaces` is the marker rather than `package.json` itself, because every package on the way up
 * has one of those; the nearest match would be the package we started from.
 *
 * USAGE:
 * await resolveWorkspaceRootLayerBroker({ startPath: AbsoluteFilePathStub({ value: '/repo/packages/web' }) });
 * // Returns '/repo', or null when nothing above declares workspaces
 */

import {
  absoluteFilePathContract,
  filePathContract,
  type AbsoluteFilePath,
} from '@dungeonmaster/shared/contracts';

import { packageJsonContract } from '../../../contracts/package-json/package-json-contract';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';

export const resolveWorkspaceRootLayerBroker = async ({
  startPath,
}: {
  startPath: AbsoluteFilePath;
}): Promise<AbsoluteFilePath | null> => {
  const manifestPath = filePathContract.parse(`${String(startPath)}/package.json`);
  const raw = await fsReadFileAdapter({ filePath: manifestPath }).catch(() => null);

  const workspaces =
    raw === null
      ? undefined
      : ((): ReturnType<typeof packageJsonContract.parse>['workspaces'] => {
          try {
            return packageJsonContract.parse(JSON.parse(raw)).workspaces;
          } catch {
            // A package.json that does not parse tells us nothing about workspaces; the walk
            // continues upward rather than stopping on a file it could not read.
            return undefined;
          }
        })();

  if (workspaces !== undefined && workspaces.length > 0) {
    return startPath;
  }

  const current = String(startPath);
  const lastSlash = current.lastIndexOf('/');

  // `lastSlash <= 0` is a top-level directory, whose parent is the filesystem root. Nothing
  // declares workspaces there, and recursing on '' would loop.
  if (lastSlash <= 0) {
    return null;
  }

  return resolveWorkspaceRootLayerBroker({
    startPath: absoluteFilePathContract.parse(current.slice(0, lastSlash)),
  });
};
