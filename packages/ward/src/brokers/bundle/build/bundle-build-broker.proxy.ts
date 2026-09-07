import {
  fsExistsSyncAdapterProxy,
  childProcessSpawnCaptureAdapterProxy,
} from '@dungeonmaster/shared/testing';
import {
  ErrorMessageStub,
  ExitCodeStub,
  absoluteFilePathContract,
  filePathContract,
} from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import { cryptoHashFilesAdapterProxy } from '../../../adapters/crypto/hash-files/crypto-hash-files-adapter.proxy';
import { fsMkdirAdapterProxy } from '../../../adapters/fs/mkdir/fs-mkdir-adapter.proxy';
import { fsRenameAdapterProxy } from '../../../adapters/fs/rename/fs-rename-adapter.proxy';
import { fsRmAdapterProxy } from '../../../adapters/fs/rm/fs-rm-adapter.proxy';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { GitRelativePathStub } from '../../../contracts/git-relative-path/git-relative-path.stub';
import { bundleStatics } from '../../../statics/bundle/bundle-statics';
import { collectInputsLayerBrokerProxy } from './collect-inputs-layer-broker.proxy';

// The workspace setupWorkspace describes: web depends on shared, and the four files they
// contribute are what the caller's expected hash is the sha-256 of.
const REPO_ROOT = absoluteFilePathContract.parse('/project');
const WEB_ROOT = absoluteFilePathContract.parse('/project/packages/web');
const SHARED_ROOT = absoluteFilePathContract.parse('/project/packages/shared');

// The single-package fixture setupCachedSinglePackageBundle describes: a lockfile and one source
// file, hashed against the package's own root. Its digest is the same wherever that root sits,
// because the hash covers the RELATIVE paths.
const SOLO_SOURCE_FILE = 'src/app.tsx';
const SOLO_SHELL_FILE = 'index.html';

export const bundleBuildBrokerProxy = (): {
  setupWorkspace: () => void;
  setupNoBuildScript: () => void;
  setupCachedBundle: (params: { hash: string }) => void;
  setupNoCachedBundle: (params: { hash: string }) => void;
  setupBuildSucceeds: () => void;
  setupBuildFails: (params: { output: string }) => void;
  setupPublishWins: (params: { hash: string }) => void;
  setupPublishLoses: (params: { hash: string }) => void;
  setupCachedSinglePackageBundle: (params: { packageRoot: AbsoluteFilePath; hash: string }) => void;
  bundleDirFor: (params: { packageRoot: AbsoluteFilePath; hash: string }) => AbsoluteFilePath;
  getSpawnedArgs: () => unknown;
  getSpawnedCwd: () => unknown;
  getRemovedTempPaths: () => readonly unknown[][];
  getPublishCalls: () => readonly unknown[][];
} => {
  const inputsProxy = collectInputsLayerBrokerProxy();
  const hashProxy = cryptoHashFilesAdapterProxy();
  const existsProxy = fsExistsSyncAdapterProxy();
  const mkdirProxy = fsMkdirAdapterProxy();
  const rmProxy = fsRmAdapterProxy();
  const renameProxy = fsRenameAdapterProxy();
  const spawnProxy = childProcessSpawnCaptureAdapterProxy();
  const readProxy = fsReadFileAdapterProxy();

  const bundleParent = `${String(WEB_ROOT)}/${bundleStatics.parentDir}`;
  const tempPath = filePathContract.parse(
    `${bundleParent}/${bundleStatics.tempPrefix}${String(process.pid)}`,
  );

  const hashDirFor = ({
    packageRoot,
    hash,
  }: {
    packageRoot: AbsoluteFilePath;
    hash: string;
  }): AbsoluteFilePath =>
    absoluteFilePathContract.parse(`${String(packageRoot)}/${bundleStatics.parentDir}/${hash}`);

  return {
    setupWorkspace: (): void => {
      inputsProxy.setupWorkspaceRoot({
        packageDirs: ['shared', 'web'],
        packageNames: ['@dm/shared', '@dm/web'],
      });
      inputsProxy.setupPackage({
        packageRoot: SHARED_ROOT,
        name: '@dm/shared',
        dependencies: [],
        sourceFiles: ['src/statics.ts'],
        isBundled: false,
      });
      inputsProxy.setupPackage({
        packageRoot: WEB_ROOT,
        name: '@dm/web',
        dependencies: ['@dm/shared'],
        sourceFiles: ['src/app.tsx'],
        isBundled: true,
      });

      hashProxy.hasFile({
        rootPath: REPO_ROOT,
        relativePath: GitRelativePathStub({ value: bundleStatics.lockfileName }),
        contents: '{"lockfileVersion":3}',
      });
      hashProxy.hasFile({
        rootPath: REPO_ROOT,
        relativePath: GitRelativePathStub({ value: 'packages/shared/src/statics.ts' }),
        contents: 'export const s = 2;',
      });
      hashProxy.hasFile({
        rootPath: REPO_ROOT,
        relativePath: GitRelativePathStub({ value: 'packages/web/index.html' }),
        contents: '<!doctype html>',
      });
      hashProxy.hasFile({
        rootPath: REPO_ROOT,
        relativePath: GitRelativePathStub({ value: 'packages/web/src/app.tsx' }),
        contents: 'export const App = 1;',
      });

      mkdirProxy.succeeds({ dirPath: filePathContract.parse(bundleParent) });
      rmProxy.succeeds({ filePath: tempPath });
    },

    setupNoBuildScript: (): void => {
      readProxy.returns({
        filePath: filePathContract.parse(`${String(WEB_ROOT)}/package.json`),
        content: JSON.stringify({ name: '@dm/web', scripts: { test: 'jest' } }),
      });
    },

    setupCachedBundle: ({ hash }: { hash: string }): void => {
      existsProxy.returns({
        filePath: filePathContract.parse(String(hashDirFor({ packageRoot: WEB_ROOT, hash }))),
        result: true,
      });
    },

    setupNoCachedBundle: ({ hash }: { hash: string }): void => {
      existsProxy.returns({
        filePath: filePathContract.parse(String(hashDirFor({ packageRoot: WEB_ROOT, hash }))),
        result: false,
      });
    },

    setupBuildSucceeds: (): void => {
      spawnProxy.setupSuccess({
        command: bundleStatics.buildCommand,
        exitCode: ExitCodeStub({ value: 0 }),
        stdout: ErrorMessageStub({ value: 'built in 9.7s' }),
        stderr: ErrorMessageStub({ value: '' }),
      });
    },

    setupBuildFails: ({ output }: { output: string }): void => {
      spawnProxy.setupSuccess({
        command: bundleStatics.buildCommand,
        exitCode: ExitCodeStub({ value: 1 }),
        stdout: ErrorMessageStub({ value: output }),
        stderr: ErrorMessageStub({ value: '' }),
      });
    },

    setupPublishWins: ({ hash }: { hash: string }): void => {
      renameProxy.succeeds({
        fromPath: tempPath,
        toPath: filePathContract.parse(String(hashDirFor({ packageRoot: WEB_ROOT, hash }))),
      });
    },

    setupPublishLoses: ({ hash }: { hash: string }): void => {
      renameProxy.losesRace({
        fromPath: tempPath,
        toPath: filePathContract.parse(String(hashDirFor({ packageRoot: WEB_ROOT, hash }))),
      });
    },

    // A package that is its own workspace root, with a bundle for its current inputs already on
    // disk — the shape a caller staging an e2e run wants, where the bundle is a given and the
    // build is not what the test is about.
    setupCachedSinglePackageBundle: ({
      packageRoot,
      hash,
    }: {
      packageRoot: AbsoluteFilePath;
      hash: string;
    }): void => {
      inputsProxy.setupNoWorkspaceAbove({ packageRoot });
      inputsProxy.setupPackage({
        packageRoot,
        name: 'bundled',
        dependencies: [],
        sourceFiles: [SOLO_SOURCE_FILE],
        isBundled: true,
      });

      hashProxy.hasFile({
        rootPath: packageRoot,
        relativePath: GitRelativePathStub({ value: bundleStatics.lockfileName }),
        contents: '{"lockfileVersion":3}',
      });
      hashProxy.hasFile({
        rootPath: packageRoot,
        relativePath: GitRelativePathStub({ value: SOLO_SOURCE_FILE }),
        contents: 'export const App = 1;',
      });
      // The bundled package's globs also match its HTML shell, so its bytes are part of the hash.
      // Left unstaged it would still be read — a composed proxy elsewhere answers unknown
      // readFileSync paths with '' — and the digest would silently be one over an empty file.
      hashProxy.hasFile({
        rootPath: packageRoot,
        relativePath: GitRelativePathStub({ value: SOLO_SHELL_FILE }),
        contents: '<!doctype html>',
      });

      existsProxy.returns({
        filePath: filePathContract.parse(String(hashDirFor({ packageRoot, hash }))),
        result: true,
      });
    },

    bundleDirFor: ({
      packageRoot,
      hash,
    }: {
      packageRoot: AbsoluteFilePath;
      hash: string;
    }): AbsoluteFilePath => hashDirFor({ packageRoot, hash }),

    getSpawnedArgs: (): unknown =>
      spawnProxy.getSpawnedArgs({ command: bundleStatics.buildCommand }),

    getSpawnedCwd: (): unknown => spawnProxy.getSpawnedCwd({ command: bundleStatics.buildCommand }),

    getRemovedTempPaths: (): readonly unknown[][] => rmProxy.getCallsFor({ filePath: tempPath }),

    getPublishCalls: (): readonly unknown[][] => renameProxy.getCallsFor({ fromPath: tempPath }),
  };
};
