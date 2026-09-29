/**
 * PURPOSE: Restores state from a snapshot payload into the instance's throwaway home directory.
 * Compares files in homePath and payloadPath (excluding .siegelense-snapshots), removes
 * added files, copies the payload into home, and reports the undid diff ({ files, added,
 * modified, removed }).
 *
 * A same-size pair is decided by CONTENT, never by mtime (DEF-81): `snapshotCaptureBroker`'s own
 * copy stamps every payload file with a fresh `modifiedAtMs`, so an mtime compare flags every
 * untouched file as "modified" on every capture-then-restore cycle, and a size-only compare can
 * just as easily miss a same-size edit. Only a genuine size difference is decided without a read;
 * everything else same-size is hashed on both sides and compared.
 *
 * USAGE:
 * await snapshotRestoreLayerBroker({
 *   homePath: AbsoluteFilePathStub({ value: '/tmp/instance-home' }),
 *   payloadPath: AbsoluteFilePathStub({ value: '/tmp/instance-home/.siegelense-snapshots/1' }),
 * });
 * // Returns { files: 3, added: 1, modified: 1, removed: 1 }
 */

import { createHash } from '#gateway/node/crypto';
import { readdirEntriesSync } from '#gateway/node/fs';
import { copyDirContents, readFile, rm } from '#gateway/node/fs__promises';
import {
  absoluteFilePathContract,
  relativeFilePathContract,
} from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath, RelativeFilePath } from '@dungeonmaster/shared/contracts';

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
    const entries = readdirEntriesSync(currentDir);
    for (const entry of entries) {
      if (currentDir === homePath && entry.name === snapshotStatics.store.dirName) {
        continue;
      }
      const entryPath = absoluteFilePathContract.parse(`${String(currentDir)}/${entry.name}`);
      if (entry.kind === 'directory') {
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
    const entries = readdirEntriesSync(currentDir);
    for (const entry of entries) {
      const entryPath = absoluteFilePathContract.parse(`${String(currentDir)}/${entry.name}`);
      if (entry.kind === 'directory') {
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

  await Promise.all(
    addedPaths.map(async (dirPath) => rm(dirPath, { recursive: true, force: true })),
  );

  let modifiedCount = 0;
  let removedCount = 0;
  const sameSizeCandidates: RelativeFilePath[] = [];
  for (const [relPath, payloadStat] of payloadFiles) {
    const homeStat = homeFiles.get(relPath);
    if (homeStat === undefined) {
      removedCount += 1;
    } else if (homeStat.sizeBytes === payloadStat.sizeBytes) {
      sameSizeCandidates.push(relPath);
    } else {
      modifiedCount += 1;
    }
  }

  // A size match is not a content match, so every same-size pair is hashed on both sides —
  // never decided by mtime, which a capture-then-restore cycle always changes (DEF-81).
  const contentDiffers = await Promise.all(
    sameSizeCandidates.map(async (relPath) => {
      const homeContent = await readFile(
        absoluteFilePathContract.parse(`${String(homePath)}${String(relPath).slice(1)}`),
      );
      const payloadContent = await readFile(
        absoluteFilePathContract.parse(`${String(payloadPath)}${String(relPath).slice(1)}`),
      );
      const homeHash = createHash('sha256').update(homeContent).digest('hex');
      const payloadHash = createHash('sha256').update(payloadContent).digest('hex');
      return homeHash !== payloadHash;
    }),
  );
  modifiedCount += contentDiffers.filter(Boolean).length;

  await copyDirContents({ from: payloadPath, to: homePath, excludeNames: [] });

  const addedCount = addedPaths.length;
  const totalFiles = addedCount + modifiedCount + removedCount;

  return resetUndidContract.parse({
    files: readingCountContract.parse(totalFiles),
    added: readingCountContract.parse(addedCount),
    modified: readingCountContract.parse(modifiedCount),
    removed: readingCountContract.parse(removedCount),
  });
};
