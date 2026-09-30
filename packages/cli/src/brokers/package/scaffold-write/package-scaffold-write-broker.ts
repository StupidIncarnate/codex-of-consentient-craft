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
import { join, dirname } from '#gateway/node/path';
import { existsSync } from '#gateway/node/fs';
import { ensureDir, writeFile } from '#gateway/node/fs__promises';

import type { ScaffoldFile } from '../../../contracts/scaffold-file/scaffold-file-contract';

export const packageScaffoldWriteBroker = async ({
  packageRoot,
  files,
}: {
  packageRoot: string;
  files: readonly ScaffoldFile[];
}): Promise<readonly string[]> => {
  if (existsSync(packageRoot)) {
    throw new Error(
      `Cannot scaffold ${packageRoot}: a package already exists there and this command will not overwrite it.`,
    );
  }

  const writtenFiles: string[] = [];

  // A sequential reduce chain, not a for-of with await: a later file's mkdir can land under a
  // directory an earlier file's mkdir just created, so the writes are order-dependent and
  // `no-await-in-loop` (error, repo-wide) forbids the loop-statement form of that same sequencing.
  await files.reduce(async (previous, file) => {
    await previous;

    const absolutePath = join(packageRoot, file.relativePath);
    const parentDir = dirname(absolutePath);

    await ensureDir(parentDir);
    await writeFile(absolutePath, file.contents);

    writtenFiles.push(absolutePath);
  }, Promise.resolve());

  return writtenFiles;
};
