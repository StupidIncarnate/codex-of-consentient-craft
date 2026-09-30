import { join } from '#gateway/node/path';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';

import { readdirIfExistsProxy } from '#gateway/node/fs__promises/readdir-if-exists/readdir-if-exists.proxy';

export const runListLayerBrokerProxy = (): {
  setupRuns: (params: { evidencePath: string; entries: readonly string[] }) => void;
  setupRunsDirMissing: (params: { evidencePath: string }) => void;
} => {
  // `join` (from '#gateway/node/path') runs for real, on a sticky passthrough default — the runs
  // dir is a plain `path.join(evidencePath, 'runs')`, and every other broker in this package
  // resolves its own paths the same real way rather than through a one-shot override.
  const realPath = requireActual<{ join: typeof join }>({ module: 'path' });
  registerMock({ fn: join })
    .calledWith([])
    .implement((...segments: never[]) => realPath.join(...segments));
  const readdirProxy = readdirIfExistsProxy();

  return {
    setupRuns: ({
      evidencePath,
      entries,
    }: {
      evidencePath: string;
      entries: readonly string[];
    }): void => {
      const runsDir = `${evidencePath}/runs`;
      readdirProxy.returns({ path: runsDir, names: [...entries] });
    },

    setupRunsDirMissing: ({ evidencePath }: { evidencePath: string }): void => {
      const runsDir = `${evidencePath}/runs`;
      readdirProxy.missing({ path: runsDir });
    },
  };
};
