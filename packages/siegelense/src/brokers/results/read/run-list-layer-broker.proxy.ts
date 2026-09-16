import { pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';
import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import { fsReaddirAdapterProxy } from '../../../adapters/fs/readdir/fs-readdir-adapter.proxy';

export const runListLayerBrokerProxy = (): {
  setupRuns: (params: { evidencePath: AbsoluteFilePath; entries: readonly string[] }) => void;
  setupRunsDirMissing: (params: { evidencePath: AbsoluteFilePath }) => void;
} => {
  // pathJoinAdapter runs for real (its proxy's own sticky passthrough) — the runs dir is a plain
  // `path.join(evidencePath, 'runs')`, and every other broker in this package resolves its own
  // paths the same real way rather than through a one-shot override.
  pathJoinAdapterProxy();
  const readdirProxy = fsReaddirAdapterProxy();

  return {
    setupRuns: ({
      evidencePath,
      entries,
    }: {
      evidencePath: AbsoluteFilePath;
      entries: readonly string[];
    }): void => {
      const runsDir = AbsoluteFilePathStub({ value: `${evidencePath}/runs` });
      readdirProxy.resolves({ dirPath: runsDir, entries });
    },

    setupRunsDirMissing: ({ evidencePath }: { evidencePath: AbsoluteFilePath }): void => {
      const runsDir = AbsoluteFilePathStub({ value: `${evidencePath}/runs` });
      readdirProxy.resolves({ dirPath: runsDir, entries: [] });
    },
  };
};
