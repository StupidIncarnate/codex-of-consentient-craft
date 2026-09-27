/**
 * PURPOSE: A complete, real `fs.Stats`-shaped value, built by hand rather than through `new
 * Stats()` — that constructor works but is deprecated (`DEP0180`). `Stats` merges an all-public
 * interface with a class declaring only a private constructor, so a plain object literal
 * satisfies the type with no cast: every data field, every date getter and all seven `is…()`
 * methods are present, which is what makes this object usable anywhere a real `Stats` is expected
 * — it is simply never `instanceof fs.Stats` (a `Stats` schema needs `z.custom`, not
 * `z.instanceof`, to accept it — see G20).
 *
 * USAGE:
 * const stats = StatsStub({ kind: 'directory' });
 * // Returns a real Stats-shaped value where stats.isDirectory() is true
 */
import type { Stats } from 'fs';

export const StatsStub = ({
  kind = 'file',
  sizeBytes = 0,
  modifiedAtMs = 0,
}: {
  kind?: 'file' | 'directory' | 'symlink' | 'other';
  sizeBytes?: number;
  modifiedAtMs?: number;
} = {}): Stats => {
  const isFile = kind === 'file';
  const isDirectory = kind === 'directory';
  const isSymbolicLink = kind === 'symlink';

  return {
    dev: 0,
    ino: 0,
    mode: 0,
    nlink: 1,
    uid: 0,
    gid: 0,
    rdev: 0,
    size: sizeBytes,
    blksize: 4096,
    blocks: 0,
    atimeMs: modifiedAtMs,
    mtimeMs: modifiedAtMs,
    ctimeMs: modifiedAtMs,
    birthtimeMs: modifiedAtMs,
    atime: new Date(modifiedAtMs),
    mtime: new Date(modifiedAtMs),
    ctime: new Date(modifiedAtMs),
    birthtime: new Date(modifiedAtMs),
    isFile: (): boolean => isFile,
    isDirectory: (): boolean => isDirectory,
    isBlockDevice: (): boolean => false,
    isCharacterDevice: (): boolean => false,
    isSymbolicLink: (): boolean => isSymbolicLink,
    isFIFO: (): boolean => false,
    isSocket: (): boolean => false,
  };
};
