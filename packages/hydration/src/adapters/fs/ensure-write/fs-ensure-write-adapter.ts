/**
 * PURPOSE: The `write` route helper — `mkdir -p` the parent, then write. Reach for this over
 * `writeFile` directly in any route: a missing parent directory is CREATED, not refused, which is
 * what keeps an absent directory from surfacing as `EACCES` instead of the real cause. Node
 * builtins directly rather than a composed adapter — shared ships `fsMkdirAdapter` but no write
 * counterpart, and composing one would trip `enforce-proxy-child-creation`'s rule that an adapter
 * mocks only its own npm package.
 *
 * USAGE:
 * await fsEnsureWriteAdapter({ filePath, content });
 * // Creates every missing parent directory, writes the file, returns { success: true }
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { adapterResultContract } from '@dungeonmaster/shared/contracts';
import type {
  AdapterResult,
  AbsoluteFilePath,
  FileContents,
} from '@dungeonmaster/shared/contracts';

export const fsEnsureWriteAdapter = async ({
  filePath,
  content,
}: {
  filePath: AbsoluteFilePath;
  content: FileContents;
}): Promise<AdapterResult> => {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, content);

  return adapterResultContract.parse({ success: true });
};
