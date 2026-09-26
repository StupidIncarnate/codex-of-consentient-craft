/**
 * PURPOSE: Reads a path's metadata as a plain object, never Node's own `Stats` instance. Every
 * caller across the repo either uses this shape already or fakes it with a cast; this makes the
 * cast unnecessary. Reach for statIfExists when a missing path is an ordinary answer.
 *
 * USAGE:
 * await stat('/repo/.dungeonmaster.json');
 * // Returns { kind: 'file', sizeBytes, modifiedAtMs }; rejects on ENOENT and every other failure
 */

import { stat as fsStat } from 'fs/promises';

export interface FileStat {
  kind: 'file' | 'directory' | 'symlink' | 'other';
  sizeBytes: number;
  modifiedAtMs: number;
}

export const stat = async (path: string): Promise<FileStat> => {
  const stats = await fsStat(path);
  const sizeBytes = stats.size;
  const modifiedAtMs = Math.floor(stats.mtimeMs);

  if (stats.isFile()) {
    return { kind: 'file', sizeBytes, modifiedAtMs };
  }
  if (stats.isDirectory()) {
    return { kind: 'directory', sizeBytes, modifiedAtMs };
  }
  if (stats.isSymbolicLink()) {
    return { kind: 'symlink', sizeBytes, modifiedAtMs };
  }
  return { kind: 'other', sizeBytes, modifiedAtMs };
};
