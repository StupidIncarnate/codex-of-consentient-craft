import { osUserHomedirAdapterProxy } from '@dungeonmaster/shared/testing';

import { fsReaddirIfExistsAdapterProxy } from '../../../adapters/fs/readdir-if-exists/fs-readdir-if-exists-adapter.proxy';
import { fsStatAdapterProxy } from '../../../adapters/fs/stat/fs-stat-adapter.proxy';
import { FolderNameStub } from '../../../contracts/folder-name/folder-name.stub';

export const claudeCodeSessionResolveBrokerProxy = (): {
  setupHomedir: (params: { homedir: string }) => void;
  setupSessionsDir: (params: { entries: readonly { name: string; mtimeMs: number }[] }) => void;
  setupSessionsDirMissing: () => void;
} => {
  const homedirProxy = osUserHomedirAdapterProxy();
  const readdirProxy = fsReaddirIfExistsAdapterProxy();
  const statProxy = fsStatAdapterProxy();

  return {
    setupHomedir: ({ homedir }: { homedir: string }): void => {
      homedirProxy.returns({ path: homedir });
    },
    setupSessionsDir: ({
      entries,
    }: {
      entries: readonly { name: string; mtimeMs: number }[];
    }): void => {
      const folderNames = entries.map((e) => FolderNameStub({ value: e.name }));
      readdirProxy.returns({ entries: folderNames });
      // Queue one stat per jsonl entry, in the same order the broker iterates them.
      for (const entry of entries.filter((e) => e.name.endsWith('.jsonl'))) {
        statProxy.returns({ stats: { mtimeMs: entry.mtimeMs } });
      }
    },
    setupSessionsDirMissing: (): void => {
      readdirProxy.returnsUndefined();
    },
  };
};
