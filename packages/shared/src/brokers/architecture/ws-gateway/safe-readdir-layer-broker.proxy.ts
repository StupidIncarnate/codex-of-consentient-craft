import type { Dirent } from 'fs';
import { readdirSync } from 'fs';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { readdirEntriesSyncProxy } from '#gateway/node/fs/readdir-entries-sync/readdir-entries-sync.proxy';
import type { DirEntrySync } from '#gateway/node/fs';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';

const anyPath = (value: unknown): boolean => typeof value === 'string';

export const safeReaddirLayerBrokerProxy = (): {
  setupDirectory: ({
    dirPath,
    entries,
  }: {
    dirPath: AbsoluteFilePath;
    entries: DirEntrySync[];
  }) => DirEntrySync[];
  setupError: ({ dirPath, error }: { dirPath: AbsoluteFilePath; error: Error }) => void;
  setupImplementation: ({ fn }: { fn: (dirPath: string) => Dirent[] }) => void;
} => {
  const gatewayProxy = readdirEntriesSyncProxy();
  // Registers directly on the real `readdirSync` (rather than composing the gateway proxy's own
  // `.returns()`/`.throws()`) so a caller with no single directory to key on can answer every
  // call from one function, with the gateway's own real `.map()` into `{name, kind}` still
  // running for real underneath.
  const handle = registerMock({ fn: readdirSync });

  return {
    setupDirectory: ({
      dirPath,
      entries,
    }: {
      dirPath: AbsoluteFilePath;
      entries: DirEntrySync[];
    }): DirEntrySync[] => {
      gatewayProxy.returns({ path: dirPath, entries });
      return entries;
    },

    setupError: ({ dirPath, error }: { dirPath: AbsoluteFilePath; error: Error }): void => {
      gatewayProxy.throws({ path: dirPath, error });
    },

    setupImplementation: ({ fn }: { fn: (dirPath: string) => Dirent[] }): void => {
      handle.calledWith([anyPath]).implement(fn as never);
    },
  };
};
