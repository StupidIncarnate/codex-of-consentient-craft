/**
 * PURPOSE: Wraps `fs.statSync`, returning a plain value instead of a `Stats` instance so
 * callers never cast (`as unknown as Stats`) to fake one. Every OS error passes through raw.
 *
 * USAGE:
 * const info = statSync('/tmp/config.json');
 * // Returns { kind: 'file', sizeBytes: 42, modifiedAtMs: 1700000000000 }
 */
import { statSync as nodeStatSync } from 'fs';

export interface FsStat {
  kind: 'file' | 'directory' | 'symlink' | 'other';
  sizeBytes: number;
  modifiedAtMs: number;
}

export const statSync = (path: string): FsStat => {
  const stats = nodeStatSync(path);
  const kind: FsStat['kind'] = stats.isDirectory()
    ? 'directory'
    : stats.isFile()
      ? 'file'
      : stats.isSymbolicLink()
        ? 'symlink'
        : 'other';

  return { kind, sizeBytes: stats.size, modifiedAtMs: stats.mtimeMs };
};
