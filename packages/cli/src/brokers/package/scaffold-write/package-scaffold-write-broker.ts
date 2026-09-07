/**
 * PURPOSE: The single write path a package-scaffolding command uses to lay a planned file list
 * onto disk — refuses outright when packageRoot already exists, checked before any directory is
 * touched, which is what stops `create-package` from clobbering a package someone is already
 * mid-edit on.
 *
 * USAGE:
 * const written = await packageScaffoldWriteBroker({
 *   packageRoot: FilePathStub({ value: '/repo/packages/widget-forge' }),
 *   files: [ScaffoldFileStub({ relativePath: 'package.json' })],
 * });
 * // Returns the absolute path of every file written, in write order
 */
import {
  pathJoinAdapter,
  pathDirnameAdapter,
  fsExistsSyncAdapter,
} from '@dungeonmaster/shared/adapters';
import type { FilePath } from '@dungeonmaster/shared/contracts';

import { fsMkdirAdapter } from '../../../adapters/fs/mkdir/fs-mkdir-adapter';
import { fsWriteFileAdapter } from '../../../adapters/fs/write-file/fs-write-file-adapter';
import type { ScaffoldFile } from '../../../contracts/scaffold-file/scaffold-file-contract';

export const packageScaffoldWriteBroker = async ({
  packageRoot,
  files,
}: {
  packageRoot: FilePath;
  files: readonly ScaffoldFile[];
}): Promise<readonly FilePath[]> => {
  if (fsExistsSyncAdapter({ filePath: packageRoot })) {
    throw new Error(
      `Cannot scaffold ${packageRoot}: a package already exists there and this command will not overwrite it.`,
    );
  }

  const writtenFiles: FilePath[] = [];

  // A sequential reduce chain, not a for-of with await: a later file's mkdir can land under a
  // directory an earlier file's mkdir just created, so the writes are order-dependent and
  // `no-await-in-loop` (error, repo-wide) forbids the loop-statement form of that same sequencing.
  await files.reduce(async (previous, file) => {
    await previous;

    const absolutePath = pathJoinAdapter({ paths: [packageRoot, file.relativePath] });
    const parentDir = pathDirnameAdapter({ path: absolutePath });

    await fsMkdirAdapter({ filePath: parentDir });
    await fsWriteFileAdapter({ filePath: absolutePath, contents: file.contents });

    writtenFiles.push(absolutePath);
  }, Promise.resolve());

  return writtenFiles;
};
