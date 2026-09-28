import { readdirEntriesSyncProxy } from '#gateway/node/fs/readdir-entries-sync/readdir-entries-sync.proxy';
import { homedir } from '#gateway/node/os';
import { join } from '#gateway/node/path';
import type { FilePath } from '@dungeonmaster/shared/contracts';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';

export const directoryBrowseBrokerProxy = (): {
  setupDirectories: (params: {
    targetPath: string;
    directories: { name: string; joinedPath: FilePath }[];
    files: string[];
    hiddenDirectories: string[];
  }) => void;
  setupDefaultHomedir: (params: {
    homeDir: string;
    directories: { name: string; joinedPath: FilePath }[];
  }) => void;
  setupEmpty: (params: { targetPath: string }) => void;
  setupThrows: (params: { targetPath: string; error: Error }) => void;
} => {
  const readdirProxy = readdirEntriesSyncProxy();
  const homedirHandle = registerMock({ fn: homedir });
  const joinHandle: MockHandle = registerMock({ fn: join });

  const stageEntries = ({
    path,
    directories,
    files,
    hiddenDirectories,
  }: {
    path: string;
    directories: { name: string; joinedPath: FilePath }[];
    files: string[];
    hiddenDirectories: string[];
  }): void => {
    readdirProxy.returns({
      path,
      entries: [
        ...directories.map(({ name }) => ({ name, kind: 'directory' as const })),
        ...files.map((name) => ({ name, kind: 'file' as const })),
        ...hiddenDirectories.map((name) => ({ name, kind: 'directory' as const })),
      ],
    });

    for (const { name, joinedPath } of directories) {
      joinHandle.calledWith([path, name]).returns(joinedPath);
    }
  };

  return {
    setupDirectories: ({
      targetPath,
      directories,
      files,
      hiddenDirectories,
    }: {
      targetPath: string;
      directories: { name: string; joinedPath: FilePath }[];
      files: string[];
      hiddenDirectories: string[];
    }): void => {
      stageEntries({ path: targetPath, directories, files, hiddenDirectories });
    },

    setupDefaultHomedir: ({
      homeDir,
      directories,
    }: {
      homeDir: string;
      directories: { name: string; joinedPath: FilePath }[];
    }): void => {
      homedirHandle.calledWith([]).returns(homeDir);
      stageEntries({ path: homeDir, directories, files: [], hiddenDirectories: [] });
    },

    setupEmpty: ({ targetPath }: { targetPath: string }): void => {
      readdirProxy.returns({ path: targetPath, entries: [] });
    },

    setupThrows: ({ targetPath, error }: { targetPath: string; error: Error }): void => {
      readdirProxy.throws({ path: targetPath, error });
    },
  };
};
