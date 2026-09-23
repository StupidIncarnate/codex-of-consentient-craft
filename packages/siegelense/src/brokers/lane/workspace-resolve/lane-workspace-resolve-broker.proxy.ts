// PURPOSE: Stages the two fs boundaries laneWorkspaceResolveBroker composes — the `packages/`
// listing and each candidate's `src`, `src/adapters` and `package.json` — as PATH-SPECIFIC mock
// registrations (never the low-specificity `setupPackage` catch-all `architecturePackageTypeDetectBrokerProxy`
// exposes), because a test staging SEVERAL candidate packages at once needs every candidate's
// registration to coexist rather than the last one shadowing the rest. Paths are built with plain
// template-literal concatenation, NEVER the mocked `pathJoinAdapter` — that mock is shared with
// every OTHER composed proxy (`cwdResolveBrokerProxy` included), and a one-shot ANOTHER proxy staged
// for its own later call is address-blind (`onceFor([])` matches any join call), so this proxy's own
// join would steal it. `architecturePackageTypeDetectBroker` runs for real against these stages,
// building the SAME `${packageRoot}/src` shape internally — this mirrors that, not reinvents it.
// USAGE: const proxy = laneWorkspaceResolveBrokerProxy();
//        proxy.setupPackagesDir({ repoRoot, packageNames: ['server', 'web'] });
//        proxy.setupPackage({ repoRoot, dirName: 'server', packageName: '@dungeonmaster/server', adapterDirNames: ['hono'] });

import type { Dirent } from 'fs';
import {
  fsReaddirWithTypesAdapterProxy,
  fsReadFileSyncAdapterProxy,
  pathJoinAdapterProxy,
  architecturePackageTypeDetectBrokerProxy,
} from '@dungeonmaster/shared/testing';
import { absoluteFilePathContract, contentTextContract } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

const makeDirDirent = ({ name }: { name: string }): Dirent =>
  ({
    name,
    isDirectory: () => true,
    isFile: () => false,
    isBlockDevice: () => false,
    isCharacterDevice: () => false,
    isFIFO: () => false,
    isSocket: () => false,
    isSymbolicLink: () => false,
  }) as Dirent;

const makeFileDirent = ({ name }: { name: string }): Dirent =>
  ({
    name,
    isDirectory: () => false,
    isFile: () => true,
    isBlockDevice: () => false,
    isCharacterDevice: () => false,
    isFIFO: () => false,
    isSocket: () => false,
    isSymbolicLink: () => false,
  }) as Dirent;

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
  const readdirProxy = fsReaddirWithTypesAdapterProxy();
  const readFileProxy = fsReadFileSyncAdapterProxy();
  // Constructed for their own default real-passthrough behavior and only to satisfy
  // enforce-proxy-child-creation — laneWorkspaceResolveBroker calls both directly, but this proxy
  // stages the two fs boundaries at the path-specific level instead (see the header comment).
  pathJoinAdapterProxy();
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
        dirPath: absoluteFilePathContract.parse(`${repoRoot}/packages`),
        entries: [
          ...packageNames.map((name) => makeDirDirent({ name })),
          ...fileNames.map((name) => makeFileDirent({ name })),
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
        filePath: absoluteFilePathContract.parse(`${packageRoot}/package.json`),
        content: contentTextContract.parse(JSON.stringify({ name: packageName, dependencies })),
      });
      readdirProxy.returns({
        dirPath: absoluteFilePathContract.parse(`${packageRoot}/src`),
        entries: srcDirNames.map((name) => makeDirDirent({ name })),
      });
      readdirProxy.returns({
        dirPath: absoluteFilePathContract.parse(`${packageRoot}/src/adapters`),
        entries: adapterDirNames.map((name) => makeDirDirent({ name })),
      });
    },
  };
};
