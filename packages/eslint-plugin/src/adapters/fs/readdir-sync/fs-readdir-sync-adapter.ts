/**
 * PURPOSE: Lists a directory's immediate entries, synchronously, each tagged with whether it is
 * itself a directory. gateway-layout reaches for this to compare a gateway subpath folder against
 * its own siblings, catching two folders whose names differ only by case.
 *
 * USAGE:
 * const entries = fsReaddirSyncAdapter({ dirPath: filePathContract.parse('/repo/packages/node/src') });
 * // Returns [{ name: 'fs', isDirectory: true }, { name: 'buffer', isDirectory: true }, ...]
 */
import { readdirSync } from 'fs';
import type { FilePath } from '@dungeonmaster/shared/contracts';
import { fileNameContract } from '../../../contracts/file-name/file-name-contract';
import type { FileName } from '../../../contracts/file-name/file-name-contract';

export const fsReaddirSyncAdapter = ({
  dirPath,
}: {
  dirPath: FilePath;
}): { name: FileName; isDirectory: boolean }[] =>
  readdirSync(dirPath, { withFileTypes: true }).map((entry) => ({
    name: fileNameContract.parse(entry.name),
    isDirectory: entry.isDirectory(),
  }));
