/**
 * PURPOSE: Restores state from a snapshot payload into the instance's throwaway home directory.
 * Compares files in homePath and payloadPath (excluding .siegelense-snapshots), removes
 * added files, copies the payload into home, and reports the undid diff ({ files, added,
 * modified, removed }).
 *
 * USAGE:
 * await snapshotRestoreLayerBroker({
 *   homePath: AbsoluteFilePathStub({ value: '/tmp/instance-home' }),
 *   payloadPath: AbsoluteFilePathStub({ value: '/tmp/instance-home/.siegelense-snapshots/1' }),
 * });
 * // Returns { files: 3, added: 1, modified: 1, removed: 1 }
 */

import { fsReaddirWithTypesAdapter } from '@dungeonmaster/shared/adapters';
import {
  absoluteFilePathContract,
  relativeFilePathContract,
} from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath, RelativeFilePath } from '@dungeonmaster/shared/contracts';

import { fsCpAdapter } from '../../../adapters/fs/cp/fs-cp-adapter';
import { fsRmAdapter } from '../../../adapters/fs/rm/fs-rm-adapter';
import { fsStatAdapter } from '../../../adapters/fs/stat/fs-stat-adapter';
import type { FileStat } from '../../../contracts/file-stat/file-stat-contract';
import { readingCountContract } from '../../../contracts/reading-count/reading-count-contract';
import { resetUndidContract } from '../../../contracts/reset-undid/reset-undid-contract';
import type { ResetUndid } from '../../../contracts/reset-undid/reset-undid-contract';
import { snapshotStatics } from '../../../statics/snapshot/snapshot-statics';

export const snapshotRestoreLayerBroker = async ({
  homePath,
  payloadPath,
}: {
  homePath: AbsoluteFilePath;
  payloadPath: AbsoluteFilePath;
}): Promise<ResetUndid> => {
  const homeFiles = new Map<RelativeFilePath, FileStat>();
  const homeQueue: AbsoluteFilePath[] = [homePath];
  const homeFilePaths: AbsoluteFilePath[] = [];
  const homePrefixLen = String(homePath).length + 1;

  while (homeQueue.length > 0) {
    const currentDir = homeQueue.shift();
    if (currentDir === undefined) {
      break;
    }
    const entries = fsReaddirWithTypesAdapter({ dirPath: currentDir });
    for (const entry of entries) {
      if (currentDir === homePath && entry.name === snapshotStatics.store.dirName) {
        continue;
      }
      const entryPath = absoluteFilePathContract.parse(`${String(currentDir)}/${entry.name}`);
      if (entry.isDirectory()) {
        homeQueue.push(entryPath);
      } else {
        homeFilePaths.push(entryPath);
      }
    }
  }

  const homeStats = await Promise.all(
    homeFilePaths.map(async (filePath) => fsStatAdapter({ filePath })),
  );
  homeFilePaths.forEach((filePath, index) => {
    const stat = homeStats[index];
    if (stat !== null && stat !== undefined) {
      const rel = `./${String(filePath).slice(homePrefixLen)}`;
      const relPath = relativeFilePathContract.parse(rel);
      homeFiles.set(relPath, stat);
    }
  });

  const payloadFiles = new Map<RelativeFilePath, FileStat>();
  const payloadQueue: AbsoluteFilePath[] = [payloadPath];
  const payloadFilePaths: AbsoluteFilePath[] = [];
  const payloadPrefixLen = String(payloadPath).length + 1;

  while (payloadQueue.length > 0) {
    const currentDir = payloadQueue.shift();
    if (currentDir === undefined) {
      break;
    }
    const entries = fsReaddirWithTypesAdapter({ dirPath: currentDir });
    for (const entry of entries) {
      const entryPath = absoluteFilePathContract.parse(`${String(currentDir)}/${entry.name}`);
      if (entry.isDirectory()) {
        payloadQueue.push(entryPath);
      } else {
        payloadFilePaths.push(entryPath);
      }
    }
  }

  const payloadStats = await Promise.all(
    payloadFilePaths.map(async (filePath) => fsStatAdapter({ filePath })),
  );
  payloadFilePaths.forEach((filePath, index) => {
    const stat = payloadStats[index];
    if (stat !== null && stat !== undefined) {
      const rel = `./${String(filePath).slice(payloadPrefixLen)}`;
      const relPath = relativeFilePathContract.parse(rel);
      payloadFiles.set(relPath, stat);
    }
  });

  const addedPaths = homeFilePaths.filter((filePath) => {
    const rel = `./${String(filePath).slice(homePrefixLen)}`;
    const relPath = relativeFilePathContract.parse(rel);
    return !payloadFiles.has(relPath);
  });

  await Promise.all(addedPaths.map(async (dirPath) => fsRmAdapter({ dirPath })));

  let modifiedCount = 0;
  let removedCount = 0;
  for (const [relPath, payloadStat] of payloadFiles) {
    const homeStat = homeFiles.get(relPath);
    if (homeStat === undefined) {
      removedCount += 1;
    } else if (
      homeStat.sizeBytes !== payloadStat.sizeBytes ||
      homeStat.modifiedAtMs !== payloadStat.modifiedAtMs
    ) {
      modifiedCount += 1;
    }
  }

  await fsCpAdapter({
    sourcePath: payloadPath,
    destinationPath: homePath,
    excludeName: null,
  });

  const addedCount = addedPaths.length;
  const totalFiles = addedCount + modifiedCount + removedCount;

  return resetUndidContract.parse({
    files: readingCountContract.parse(totalFiles),
    added: readingCountContract.parse(addedCount),
    modified: readingCountContract.parse(modifiedCount),
    removed: readingCountContract.parse(removedCount),
  });
};
