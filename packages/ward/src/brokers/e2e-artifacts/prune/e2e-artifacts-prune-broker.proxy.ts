import { listeningPidsProxy } from '#gateway/bin/lsof/listening-pids/listening-pids.proxy';
import { readdirIfExistsProxy } from '#gateway/node/fs__promises/readdir-if-exists/readdir-if-exists.proxy';
import { rmProxy } from '#gateway/node/fs__promises/rm/rm.proxy';
import { statIfExistsProxy } from '#gateway/node/fs__promises/stat-if-exists/stat-if-exists.proxy';
import { FsErrorStub } from '#gateway/node/fs/is-fs-error/fs-error.stub';

import { e2eArtifactsStatics } from '../../../statics/e2e-artifacts/e2e-artifacts-statics';

// The broker only checks `.length > 0` on what listeningPids resolves — this pid's value is never
// read, so one fixed placeholder covers every "port held" setup.
const HELD_PORT_PID = 88_888;

const DAY_MS = 86_400_000;

export const e2eArtifactsPruneBrokerProxy = (): {
  setupEntries: (params: {
    packageRoot: string;
    parentDir: string;
    entries: string[];
  }) => void;
  setupAge: (params: {
    packageRoot: string;
    parentDir: string;
    name: string;
    daysOld: number;
  }) => void;
  setupRemovable: (params: {
    packageRoot: string;
    parentDir: string;
    name: string;
  }) => void;
  setupRemoveFails: (params: {
    packageRoot: string;
    parentDir: string;
    name: string;
  }) => void;
  setupPortHeld: (params: { port: number }) => void;
  setupPortFree: (params: { port: number }) => void;
  getRemovedPaths: (params: {
    packageRoot: string;
    parentDir: string;
    name: string;
  }) => readonly unknown[][];
} => {
  // Read the clock rather than pinning it. The broker calls Date.now() a few milliseconds after
  // this, which is nothing against day-scale windows — and a spy here would fight the Date spy
  // that single-package-layer-broker.proxy.ts stages for its deterministic runId.
  const NOW = Date.now();

  const readdirProxy = readdirIfExistsProxy();
  const statProxy = statIfExistsProxy();
  const rm = rmProxy();
  const lsofProxy = listeningPidsProxy();

  const parentPathFor = ({
    packageRoot,
    parentDir,
  }: {
    packageRoot: string;
    parentDir: string;
  }): string =>
    `${String(packageRoot)}/${parentDir}`;

  const entryPathFor = ({
    packageRoot,
    parentDir,
    name,
  }: {
    packageRoot: string;
    parentDir: string;
    name: string;
  }): string =>
    `${String(packageRoot)}/${parentDir}/${name}`;

  return {
    setupEntries: ({ packageRoot, parentDir, entries }): void => {
      // The broker reads EVERY parent dir in the statics on every call, so the ones a test does not
      // describe are staged empty here. Derived from the statics rather than listed, so a new
      // artifact row cannot leave one unstaged. An unstaged readdir throws rather than answering
      // nothing.
      for (const dir of e2eArtifactsStatics.artifacts.map((artifact) => artifact.parentDir)) {
        readdirProxy.returns({
          path: String(parentPathFor({ packageRoot, parentDir: dir })),
          names: dir === parentDir ? entries : [],
        });
      }
    },
    setupAge: ({ packageRoot, parentDir, name, daysOld }): void => {
      statProxy.returnsFile({
        path: String(entryPathFor({ packageRoot, parentDir, name })),
        sizeBytes: 1024,
        modifiedAtMs: NOW - daysOld * DAY_MS,
      });
    },
    setupRemovable: ({ packageRoot, parentDir, name }): void => {
      rm.succeeds({ path: String(entryPathFor({ packageRoot, parentDir, name })) });
    },
    setupRemoveFails: ({ packageRoot, parentDir, name }): void => {
      const path = String(entryPathFor({ packageRoot, parentDir, name }));
      rm.rejects({
        path,
        error: FsErrorStub({
          code: 'ENOTEMPTY',
          syscall: 'rm',
          path,
        }),
      });
    },
    setupPortHeld: ({ port }): void => {
      lsofProxy.setupPids({ port, pids: [HELD_PORT_PID] });
    },
    setupPortFree: ({ port }): void => {
      lsofProxy.setupNoneListening({ port });
    },
    getRemovedPaths: ({ packageRoot, parentDir, name }): readonly unknown[][] =>
      rm.getCallsFor({ path: String(entryPathFor({ packageRoot, parentDir, name })) }),
  };
};
