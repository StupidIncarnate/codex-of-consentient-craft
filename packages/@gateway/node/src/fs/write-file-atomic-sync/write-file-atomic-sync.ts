/**
 * PURPOSE: Writes UTF-8 text synchronously so a reader never observes a half-written file, even
 * while other processes write the same path: the bytes land at a temp sibling named for this
 * process and thread, then `rename` swaps it onto the real path in one atomic step. Reach for this
 * over `writeFileAtomic` from `#gateway/node/fs__promises` when the caller is synchronous (an
 * ESLint rule) or several processes write one path at once — that one's fixed `.tmp` sibling is
 * shared by every writer. A failed write or rename removes the temp file before rethrowing.
 *
 * USAGE:
 * writeFileAtomicSync('/repo/node_modules/.cache/x.json', '{"a":1}');
 * // Creates the parent folder, writes x.json.<pid>-<threadId>.tmp, renames it onto x.json
 */
import { mkdirSync, renameSync, unlinkSync, writeFileSync } from 'fs';
import { dirname } from 'path';
import { threadId } from 'worker_threads';
import { isFsError } from '../is-fs-error/is-fs-error';

export const writeFileAtomicSync = (path: string, contents: string): void => {
  mkdirSync(dirname(path), { recursive: true });

  const tmpPath = `${path}.${String(process.pid)}-${String(threadId)}.tmp`;
  try {
    writeFileSync(tmpPath, contents, 'utf8');
    renameSync(tmpPath, path);
  } catch (writeError: unknown) {
    try {
      unlinkSync(tmpPath);
    } catch (unlinkError: unknown) {
      if (!isFsError({ error: unlinkError, code: 'ENOENT' })) {
        throw unlinkError;
      }
    }
    throw writeError;
  }
};
