// PURPOSE: Stages the two fs boundaries laneWorkspaceResolveBroker composes — the `packages/`
// listing and each candidate's `src`, `src/adapters` and `package.json` — as PATH-SPECIFIC mock
// registrations (never the low-specificity `setupPackage` catch-all `architecturePackageTypeDetectBrokerProxy`
// exposes), because a test staging SEVERAL candidate packages at once needs every candidate's
// registration to coexist rather than the last one shadowing the rest. Paths are built with plain
// template-literal concatenation; `join` (from '#gateway/node/path') itself runs for real, on a
// sticky passthrough default, so the broker's own real join output always matches what is staged
// here. `architecturePackageTypeDetectBroker` runs for real against these stages, building the
// SAME `${packageRoot}/src` shape internally — this mirrors that, not reinvents it.
// USAGE: const proxy = laneWorkspaceResolveBrokerProxy();
//        proxy.setupPackagesDir({ repoRoot, packageNames: ['server', 'web'] });
//        proxy.setupPackage({ repoRoot, dirName: 'server', packageName: '@dungeonmaster/server', adapterDirNames: ['hono'] });

import { join } from '#gateway/node/path';
import { readFileSyncProxy } from '#gateway/node/fs/read-file-sync/read-file-sync.proxy';
import { readdirEntriesSyncProxy } from '#gateway/node/fs/readdir-entries-sync/readdir-entries-sync.proxy';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';
import { architecturePackageTypeDetectBrokerProxy } from '@dungeonmaster/shared/testing';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

export const laneWorkspaceResolveBrokerProxy = (): {
  setupPackagesDir: (params: {
    repoRoot: AbsoluteFilePath;
    packageNames: readonly string[];
    fileNames?: readonly string[];
  }) => void;
  setupPackage: (params: {
    repoRoot: AbsoluteFilePath;
    dirName: string;
    packageName: string;
    adapterDirNames?: readonly string[];
    srcDirNames?: readonly string[];
    dependencies?: Record<string, string>;
  }) => void;
} => {
  const readdirProxy = readdirEntriesSyncProxy();
  const readFileProxy = readFileSyncProxy();
  // `join` (from '#gateway/node/path') runs for real, on a sticky passthrough default — every join
  // this broker makes (`packages`, each candidate dir, `package.json`) resolves to the SAME path
  // this proxy computes below by template-literal concatenation.
  const realPath = requireActual<{ join: typeof join }>({ module: 'path' });
  registerMock({ fn: join })
    .calledWith([])
    .implement((...segments: never[]) => realPath.join(...segments));
  // Constructed for its own default real-passthrough behavior and only to satisfy
  // enforce-proxy-child-creation — laneWorkspaceResolveBroker calls it directly, but this proxy
  // stages the two fs boundaries at the path-specific level instead (see the header comment).
  architecturePackageTypeDetectBrokerProxy();

  return {
    setupPackagesDir: ({
      repoRoot,
      packageNames,
      fileNames = [],
    }: {
      repoRoot: AbsoluteFilePath;
      packageNames: readonly string[];
      fileNames?: readonly string[];
    }): void => {
      readdirProxy.returns({
        path: `${repoRoot}/packages`,
        entries: [
          ...packageNames.map((name) => ({ name, kind: 'directory' as const })),
          ...fileNames.map((name) => ({ name, kind: 'file' as const })),
        ],
      });
    },

    setupPackage: ({
      repoRoot,
      dirName,
      packageName,
      adapterDirNames = [],
      srcDirNames = [],
      dependencies = {},
    }: {
      repoRoot: AbsoluteFilePath;
      dirName: string;
      packageName: string;
      adapterDirNames?: readonly string[];
      srcDirNames?: readonly string[];
      dependencies?: Record<string, string>;
    }): void => {
      const packageRoot = `${repoRoot}/packages/${dirName}`;
      readFileProxy.returns({
        path: `${packageRoot}/package.json`,
        contents: JSON.stringify({ name: packageName, dependencies }),
      });
      readdirProxy.returns({
        path: `${packageRoot}/src`,
        entries: srcDirNames.map((name) => ({ name, kind: 'directory' as const })),
      });
      readdirProxy.returns({
        path: `${packageRoot}/src/adapters`,
        entries: adapterDirNames.map((name) => ({ name, kind: 'directory' as const })),
      });
    },
  };
};
