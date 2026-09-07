import { filePathContract, networkPortContract } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import { fsReaddirAdapterProxy } from '../../../adapters/fs/readdir/fs-readdir-adapter.proxy';
import { fsRmAdapterProxy } from '../../../adapters/fs/rm/fs-rm-adapter.proxy';
import { fsStatAdapterProxy } from '../../../adapters/fs/stat/fs-stat-adapter.proxy';
import { netPortInUseAdapterProxy } from '../../../adapters/net/port-in-use/net-port-in-use-adapter.proxy';
import { e2eArtifactsStatics } from '../../../statics/e2e-artifacts/e2e-artifacts-statics';

const DAY_MS = 86_400_000;

export const e2eArtifactsPruneBrokerProxy = (): {
  setupEntries: (params: {
    packageRoot: AbsoluteFilePath;
    parentDir: string;
    entries: string[];
  }) => void;
  setupAge: (params: {
    packageRoot: AbsoluteFilePath;
    parentDir: string;
    name: string;
    daysOld: number;
  }) => void;
  setupRemovable: (params: {
    packageRoot: AbsoluteFilePath;
    parentDir: string;
    name: string;
  }) => void;
  setupRemoveFails: (params: {
    packageRoot: AbsoluteFilePath;
    parentDir: string;
    name: string;
  }) => void;
  setupPortHeld: (params: { port: number }) => void;
  setupPortFree: (params: { port: number }) => void;
  getRemovedPaths: (params: {
    packageRoot: AbsoluteFilePath;
    parentDir: string;
    name: string;
  }) => readonly unknown[][];
} => {
  // Read the clock rather than pinning it. The broker calls Date.now() a few milliseconds after
  // this, which is nothing against day-scale windows — and a spy here would fight the Date spy
  // that command-run-layer-single-broker.proxy.ts stages for its deterministic runId.
  const NOW = Date.now();

  const readdirProxy = fsReaddirAdapterProxy();
  const statProxy = fsStatAdapterProxy();
  const rmProxy = fsRmAdapterProxy();
  const portProxy = netPortInUseAdapterProxy();

  const parentPathFor = ({
    packageRoot,
    parentDir,
  }: {
    packageRoot: AbsoluteFilePath;
    parentDir: string;
  }): ReturnType<typeof filePathContract.parse> =>
    filePathContract.parse(`${String(packageRoot)}/${parentDir}`);

  const entryPathFor = ({
    packageRoot,
    parentDir,
    name,
  }: {
    packageRoot: AbsoluteFilePath;
    parentDir: string;
    name: string;
  }): ReturnType<typeof filePathContract.parse> =>
    filePathContract.parse(`${String(packageRoot)}/${parentDir}/${name}`);

  return {
    setupEntries: ({ packageRoot, parentDir, entries }): void => {
      // The broker reads EVERY parent dir in the statics on every call, so the ones a test does not
      // describe are staged empty here. Derived from the statics rather than listed, so a new
      // artifact row cannot leave one unstaged. An unstaged readdir throws rather than answering
      // nothing.
      for (const dir of e2eArtifactsStatics.artifacts.map((artifact) => artifact.parentDir)) {
        readdirProxy.returns({
          dirPath: parentPathFor({ packageRoot, parentDir: dir }),
          entries: dir === parentDir ? entries : [],
        });
      }
    },
    setupAge: ({ packageRoot, parentDir, name, daysOld }): void => {
      statProxy.returnsMtime({
        filePath: entryPathFor({ packageRoot, parentDir, name }),
        mtimeMs: NOW - daysOld * DAY_MS,
      });
    },
    setupRemovable: ({ packageRoot, parentDir, name }): void => {
      rmProxy.succeeds({ filePath: entryPathFor({ packageRoot, parentDir, name }) });
    },
    setupRemoveFails: ({ packageRoot, parentDir, name }): void => {
      rmProxy.throws({
        filePath: entryPathFor({ packageRoot, parentDir, name }),
        error: new Error('ENOTEMPTY: another sweep is inside this tree'),
      });
    },
    setupPortHeld: ({ port }): void => {
      portProxy.inUse({ port: networkPortContract.parse(port) });
    },
    setupPortFree: ({ port }): void => {
      portProxy.free({ port: networkPortContract.parse(port) });
    },
    getRemovedPaths: ({ packageRoot, parentDir, name }): readonly unknown[][] =>
      rmProxy.getCallsFor({ filePath: entryPathFor({ packageRoot, parentDir, name }) }),
  };
};
