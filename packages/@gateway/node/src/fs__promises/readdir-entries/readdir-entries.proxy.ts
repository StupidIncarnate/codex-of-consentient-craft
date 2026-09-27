import { readdir } from 'fs/promises';
import type { Dirent } from 'fs';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { FsErrorStub } from '../../fs/is-fs-error/fs-error.stub';

export const readdirEntriesProxy = (): {
  returns: (params: {
    path: string;
    entries: readonly { name: string; kind: 'file' | 'directory' | 'symlink' | 'other' }[];
  }) => void;
  missing: (params: { path: string }) => void;
  denied: (params: { path: string }) => void;
  notADirectory: (params: { path: string }) => void;
} => {
  const handle = registerMock({ fn: readdir });

  return {
    returns: ({
      path,
      entries,
    }: {
      path: string;
      entries: readonly { name: string; kind: 'file' | 'directory' | 'symlink' | 'other' }[];
    }): void => {
      const dirents = entries.map(
        (entry) =>
          ({
            name: entry.name,
            isFile: (): boolean => entry.kind === 'file',
            isDirectory: (): boolean => entry.kind === 'directory',
            isSymbolicLink: (): boolean => entry.kind === 'symlink',
          }) as unknown as Dirent,
      );
      handle.calledWith([path, { withFileTypes: true }]).resolves(dirents);
    },
    missing: ({ path }: { path: string }): void => {
      handle
        .calledWith([path, { withFileTypes: true }])
        .rejects(FsErrorStub({ code: 'ENOENT', path }));
    },
    denied: ({ path }: { path: string }): void => {
      handle
        .calledWith([path, { withFileTypes: true }])
        .rejects(FsErrorStub({ code: 'EACCES', path }));
    },
    notADirectory: ({ path }: { path: string }): void => {
      handle
        .calledWith([path, { withFileTypes: true }])
        .rejects(FsErrorStub({ code: 'ENOTDIR', path }));
    },
  };
};
