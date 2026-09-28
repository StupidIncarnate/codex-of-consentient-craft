/**
 * PURPOSE: A complete, real `FileStat`-shaped value matching exactly what `#gateway/node/fs__promises`'s
 * own `stat` resolves with — for a caller staging that return shape directly, rather than mocking
 * the raw `fs.Stats` `stat` reshapes it from (see `#gateway/node/fs/stats/stats.stub` for that
 * lower boundary).
 *
 * USAGE:
 * const fileStat = FileStatStub({ kind: 'directory', sizeBytes: 4096 });
 */
import type { FileStat } from './file-stat';

export const FileStatStub = ({
  kind = 'file',
  sizeBytes = 0,
  modifiedAtMs = 0,
  createdAtMs = 0,
}: {
  kind?: FileStat['kind'];
  sizeBytes?: number;
  modifiedAtMs?: number;
  createdAtMs?: number;
} = {}): FileStat => ({ kind, sizeBytes, modifiedAtMs, createdAtMs });
