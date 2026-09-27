/**
 * PURPOSE: A real ENOENT-shaped error — the recorded failure a caller stages when a read, a stat
 * or an unlink hits a path that does not exist. Thin named wrapper over `FsErrorStub`, which
 * already builds this shape generically for any fs error code; this one exists so a call site
 * reads as "the file is missing" rather than "an fs error with this particular code".
 *
 * USAGE:
 * const error = FileMissingErrorStub({ path: '/tmp/missing.json' });
 * // Returns a real Error: { code: 'ENOENT', path, syscall: 'open' }
 */
import { FsErrorStub } from '../is-fs-error/fs-error.stub';
import type { FsError } from '../is-fs-error/fs-error';

export const FileMissingErrorStub = ({ path }: { path?: string } = {}): FsError =>
  FsErrorStub({ code: 'ENOENT', syscall: 'open', ...(path === undefined ? {} : { path }) });
