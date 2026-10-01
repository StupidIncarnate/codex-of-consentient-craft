/**
 * PURPOSE: Every file under one directory of dungeonmaster's own npm gateway, at any depth, as an
 * absolute path — what the sync scans for imports before deciding a folder can be copied. Symlinks
 * and other non-regular entries are left out: the gateway's source holds none.
 *
 * USAGE:
 * await sourceFilesListLayerBroker({ dirPath: '/repo/node_modules/@dungeonmaster/npm/src/elkjs' });
 * // Returns ['/repo/.../elkjs/elkjs.ts', '/repo/.../elkjs/elk-layout-result/elk-layout-result.stub.ts', ...]
 */

import { readdirEntries } from '#gateway/node/fs__promises';
import { join } from '#gateway/node/path';

export const sourceFilesListLayerBroker = async ({
  dirPath,
}: {
  dirPath: string;
}): Promise<readonly string[]> => {
  const entries = await readdirEntries(dirPath);

  const nested = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = join(dirPath, entry.name);
      if (entry.kind === 'directory') {
        return sourceFilesListLayerBroker({ dirPath: entryPath });
      }
      return entry.kind === 'file' ? [entryPath] : [];
    }),
  );

  return nested.flat();
};
