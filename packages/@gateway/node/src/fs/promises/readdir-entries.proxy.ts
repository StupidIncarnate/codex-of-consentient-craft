import { readdir } from 'fs/promises';
import type { Dirent } from 'fs';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const readdirEntriesProxy = (): {
  returns: (params: {
    path: string;
    entries: readonly { name: string; kind: 'file' | 'directory' | 'symlink' | 'other' }[];
  }) => void;
  rejects: (params: { path: string; error: unknown }) => void;
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
    rejects: ({ path, error }: { path: string; error: unknown }): void => {
      handle.calledWith([path, { withFileTypes: true }]).rejects(error);
    },
  };
};
