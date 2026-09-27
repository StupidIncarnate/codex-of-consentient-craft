import type { Dirent } from 'fs';
import { readdirSync } from 'fs';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { readdirEntriesSyncProxy } from '#gateway/node/fs/readdir-entries-sync/readdir-entries-sync.proxy';
import type { DirEntrySync } from '#gateway/node/fs';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';

export const listDirEntriesLayerBrokerProxy = (): {
  setupFiles: ({
    dirPath,
    names,
  }: {
    dirPath: AbsoluteFilePath;
    names: string[];
  }) => DirEntrySync[];
  setupEmpty: ({ dirPath }: { dirPath: AbsoluteFilePath }) => void;
  setupError: ({ dirPath, error }: { dirPath: AbsoluteFilePath; error: Error }) => void;
  setupImplementation: ({ fn }: { fn: (dirPath: string) => Dirent[] }) => void;
} => {
  const gatewayProxy = readdirEntriesSyncProxy();
  const handle = registerMock({ fn: readdirSync });

  return {
    setupFiles: ({
      dirPath,
      names,
    }: {
      dirPath: AbsoluteFilePath;
      names: string[];
    }): DirEntrySync[] => {
      const entries = names.map((name) => ({ name, kind: 'file' as const }));
      gatewayProxy.returns({ path: dirPath, entries });
      return entries;
    },

    setupEmpty: ({ dirPath }: { dirPath: AbsoluteFilePath }): void => {
      gatewayProxy.returns({ path: dirPath, entries: [] });
    },

    setupError: ({ dirPath, error }: { dirPath: AbsoluteFilePath; error: Error }): void => {
      gatewayProxy.throws({ path: dirPath, error });
    },

    // Registers directly on the real `readdirSync` (rather than composing the gateway proxy's
    // own `.returns()`/`.throws()`) so a caller with no single directory to key on can answer
    // every call from one function, with the gateway's own real `.map()` into `{name, kind}`
    // still running for real underneath — see startup-files-find-layer-broker.proxy.ts.
    setupImplementation: ({ fn }: { fn: (dirPath: string) => Dirent[] }): void => {
      handle.calledWith([]).implement(fn as never);
    },
  };
};
