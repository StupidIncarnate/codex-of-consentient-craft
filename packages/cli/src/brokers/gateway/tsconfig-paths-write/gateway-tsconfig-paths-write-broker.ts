/**
 * PURPOSE: The one write path for merging gateway `paths` entries into ANY tsconfig file this
 * install step touches — the root tsconfig.json, a package's own tsconfig.json (only when it
 * already declares its own `paths`, via `skipWhenPathsMissing: true`), or a package's
 * tsconfig.build.json (created fresh when missing, via `skipWhenPathsMissing: false`). A missing
 * FILE is always a skip — "if one exists" for tsconfig.build.json, and a defensive no-op for the
 * other two, which the install flow always creates earlier.
 *
 * USAGE:
 * await gatewayTsconfigPathsWriteBroker({
 *   tsconfigPath: FilePathStub({value: '/repo/tsconfig.json'}),
 *   entries: TsconfigPathsMapStub(),
 *   skipWhenPathsMissing: false,
 * });
 * // Returns true when the file changed, false when the file was missing, its paths already had
 * // every entry, or (skipWhenPathsMissing: true) it never declared its own paths to begin with
 */

import { fsExistsSyncAdapter } from '@dungeonmaster/shared/adapters';
import type { FilePath } from '@dungeonmaster/shared/contracts';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { fsWriteFileAdapter } from '../../../adapters/fs/write-file/fs-write-file-adapter';
import { typescriptTsconfigPathsLocateAdapter } from '../../../adapters/typescript/tsconfig-paths-locate/typescript-tsconfig-paths-locate-adapter';
import { tsconfigPathsInsertTextTransformer } from '../../../transformers/tsconfig-paths-insert-text/tsconfig-paths-insert-text-transformer';
import type { TsconfigPathsMap } from '../../../contracts/tsconfig-paths-map/tsconfig-paths-map-contract';

export const gatewayTsconfigPathsWriteBroker = async ({
  tsconfigPath,
  entries,
  skipWhenPathsMissing,
}: {
  tsconfigPath: FilePath;
  entries: TsconfigPathsMap;
  skipWhenPathsMissing: boolean;
}): Promise<boolean> => {
  if (!fsExistsSyncAdapter({ filePath: tsconfigPath })) {
    return false;
  }

  const tsconfigText = await fsReadFileAdapter({ filePath: tsconfigPath });
  const descriptor = typescriptTsconfigPathsLocateAdapter({ text: tsconfigText });

  if (skipWhenPathsMissing && descriptor.situation !== 'hasPaths') {
    return false;
  }

  const updatedText = tsconfigPathsInsertTextTransformer({ tsconfigText, descriptor, entries });

  if (String(updatedText) === String(tsconfigText)) {
    return false;
  }

  await fsWriteFileAdapter({ filePath: tsconfigPath, contents: updatedText });

  return true;
};
