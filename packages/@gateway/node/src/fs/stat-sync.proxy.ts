import { statSync } from 'fs';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { Stats } from 'fs';

export const statSyncProxy = (): {
  returns: ({
    path,
    kind,
    sizeBytes,
    modifiedAtMs,
  }: {
    path: string;
    kind: 'file' | 'directory' | 'symlink' | 'other';
    sizeBytes: number;
    modifiedAtMs: number;
  }) => void;
  throws: ({ path, error }: { path: string; error: NodeJS.ErrnoException }) => void;
} => {
  const handle = registerMock({ fn: statSync });

  return {
    returns: ({
      path,
      kind,
      sizeBytes,
      modifiedAtMs,
    }: {
      path: string;
      kind: 'file' | 'directory' | 'symlink' | 'other';
      sizeBytes: number;
      modifiedAtMs: number;
    }): void => {
      const stats: Pick<Stats, 'isDirectory' | 'isFile' | 'isSymbolicLink' | 'size' | 'mtimeMs'> = {
        isDirectory: (): boolean => kind === 'directory',
        isFile: (): boolean => kind === 'file',
        isSymbolicLink: (): boolean => kind === 'symlink',
        size: sizeBytes,
        mtimeMs: modifiedAtMs,
      };
      handle.calledWith([path]).returns(stats as Stats);
    },
    // `.implement()`, not `.throws()` — see read-file-sync.proxy.ts for why: `.throws()`
    // coerces a non-`instanceof Error` value through `new Error(String(val))`, destroying
    // FsErrorStub's prototype-less `code`/`path`/`syscall` shape.
    throws: ({ path, error }: { path: string; error: NodeJS.ErrnoException }): void => {
      handle.calledWith([path]).implement((): never => {
        throw error;
      });
    },
  };
};
