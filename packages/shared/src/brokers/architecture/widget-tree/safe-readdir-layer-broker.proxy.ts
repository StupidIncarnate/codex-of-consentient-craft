import type { Dirent } from 'fs';
import { readdirSync } from 'fs';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { readdirEntriesSyncProxy } from '#gateway/node/fs/readdir-entries-sync/readdir-entries-sync.proxy';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';

const anyPath = (value: unknown): boolean => typeof value === 'string';

export const safeReaddirLayerBrokerProxy = (): {
  setupFiles: ({ dirPath, names }: { dirPath: AbsoluteFilePath; names: string[] }) => void;
  setupDirs: ({ dirPath, names }: { dirPath: AbsoluteFilePath; names: string[] }) => void;
  setupEmpty: ({ dirPath }: { dirPath: AbsoluteFilePath }) => void;
  setupImplementation: ({ fn }: { fn: (dirPath: string) => Dirent[] }) => void;
} => {
  const gatewayProxy = readdirEntriesSyncProxy();
  // Registers directly on the real `readdirSync` (rather than composing the gateway proxy's own
  // `.returns()`/`.throws()`) so a caller with no single directory to key on can answer every
  // call from one function, with the gateway's own real `.map()` into `{name, kind}` still
  // running for real underneath.
  const handle = registerMock({ fn: readdirSync });

  return {
    setupFiles: ({ dirPath, names }: { dirPath: AbsoluteFilePath; names: string[] }): void => {
      const entries = names.map((name) => ({ name, kind: 'file' as const }));
      gatewayProxy.returns({ path: dirPath, entries });
    },

    setupDirs: ({ dirPath, names }: { dirPath: AbsoluteFilePath; names: string[] }): void => {
      const entries = names.map((name) => ({ name, kind: 'directory' as const }));
      gatewayProxy.returns({ path: dirPath, entries });
    },

    setupEmpty: ({ dirPath }: { dirPath: AbsoluteFilePath }): void => {
      gatewayProxy.returns({ path: dirPath, entries: [] });
    },

    setupImplementation: ({ fn }: { fn: (dirPath: string) => Dirent[] }): void => {
      handle.calledWith([anyPath]).implement(fn as never);
    },
  };
};
