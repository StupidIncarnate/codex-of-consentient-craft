/**
 * PURPOSE: Checks the plain-data shape `walkFilesSync` returns — `path` a string, `sizeBytes` a
 * number, `modifiedAtMs` a number, nothing more required. `walkedFileSchema` calls this as its
 * `z.custom<WalkedFile>()` check, so a missing field or a wrong-typed one fails the parse instead of
 * silently passing through, which a bare `z.custom<WalkedFile>()` (no check function) would do.
 *
 * USAGE:
 * isWalkedFile({ path: '/repo/a.jsonl', sizeBytes: 12, modifiedAtMs: 0 });
 * // Returns true
 */
import type { WalkedFile } from './walked-file';

export const isWalkedFile = (value: unknown): value is WalkedFile =>
  typeof value === 'object' &&
  value !== null &&
  'path' in value &&
  'sizeBytes' in value &&
  'modifiedAtMs' in value &&
  typeof value.path === 'string' &&
  typeof value.sizeBytes === 'number' &&
  typeof value.modifiedAtMs === 'number';
