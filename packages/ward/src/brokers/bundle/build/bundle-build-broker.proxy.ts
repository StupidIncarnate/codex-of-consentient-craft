import { NpmNotInstalledErrorProxy } from '#gateway/bin/npm/npm-run/npm-not-installed.error.proxy';
import { runScriptProxy } from '#gateway/bin/npm/run-script/run-script.proxy';
import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { ensureDirProxy } from '#gateway/node/fs__promises/ensure-dir/ensure-dir.proxy';
import { pid } from '#gateway/node/process';
import { pidProxy } from '#gateway/node/process/pid/pid.proxy';
import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';
import { renameProxy } from '#gateway/node/fs__promises/rename/rename.proxy';
import { rmProxy } from '#gateway/node/fs__promises/rm/rm.proxy';
import { FsErrorStub } from '#gateway/node/fs/is-fs-error/fs-error.stub';
import { absoluteFilePathContract, filePathContract } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import { GitRelativePathStub } from '../../../contracts/git-relative-path/git-relative-path.stub';
import { bundleStatics } from '../../../statics/bundle/bundle-statics';
import { bundleHashFilesBrokerProxy } from '../hash-files/bundle-hash-files-broker.proxy';
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
  setupNpmMissing: () => void;
  setupPublishWins: (params: { hash: string }) => void;
  setupPublishLoses: (params: { hash: string }) => void;
  setupCachedSinglePackageBundle: (params: { packageRoot: AbsoluteFilePath; hash: string }) => void;
  bundleDirFor: (params: { packageRoot: AbsoluteFilePath; hash: string }) => AbsoluteFilePath;
  getBuildCalls: () => readonly unknown[][];
  getRemovedTempPaths: () => readonly unknown[][];
  getPublishCalls: () => readonly unknown[][];
} => {
  const inputsProxy = collectInputsLayerBrokerProxy();
  const hashProxy = bundleHashFilesBrokerProxy();
  const existsProxy = existsSyncProxy();
  const mkdirProxy = ensureDirProxy();
  const rm = rmProxy();
  const rename = renameProxy();
  const run = runScriptProxy();
  pidProxy();
  NpmNotInstalledErrorProxy();
  const readProxy = readFileProxy();

  const bundleParent = `${String(WEB_ROOT)}/${bundleStatics.parentDir}`;
  const tempPath = filePathContract.parse(
    `${bundleParent}/${bundleStatics.tempPrefix}${String(pid)}`,
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

      mkdirProxy.succeeds({ path: bundleParent });
      rm.succeeds({ path: String(tempPath) });
    },

    setupNoBuildScript: (): void => {
      readProxy.returns({
        path: filePathContract.parse(`${String(WEB_ROOT)}/package.json`),
        contents: JSON.stringify({ name: '@dm/web', scripts: { test: 'jest' } }),
      });
    },

    setupCachedBundle: ({ hash }: { hash: string }): void => {
      existsProxy.returns({
        path: String(hashDirFor({ packageRoot: WEB_ROOT, hash })),
        exists: true,
      });
    },

    setupNoCachedBundle: ({ hash }: { hash: string }): void => {
      existsProxy.returns({
        path: String(hashDirFor({ packageRoot: WEB_ROOT, hash })),
        exists: false,
      });
    },

    // Staged by script and exact args (the fixed buildArgs tail plus this proxy's own computed
    // tempPath). The cwd is not stageable through runScript's proxy, so getBuildCalls reads it back
    // and the test asserts it: a broker that built in the WRONG directory shows up there.
    setupBuildSucceeds: (): void => {
      run.setupResult({
        script: 'build',
        args: ['--', '--outDir', String(tempPath)],
        exitCode: 0,
        output: 'built in 9.7s',
      });
    },

    setupBuildFails: ({ output }: { output: string }): void => {
      run.setupResult({
        script: 'build',
        args: ['--', '--outDir', String(tempPath)],
        exitCode: 1,
        output,
      });
    },

    setupNpmMissing: (): void => {
      run.setupNotFound({ script: 'build', args: ['--', '--outDir', String(tempPath)] });
    },

    setupPublishWins: ({ hash }: { hash: string }): void => {
      rename.succeeds({
        from: String(tempPath),
        to: String(hashDirFor({ packageRoot: WEB_ROOT, hash })),
      });
    },

    setupPublishLoses: ({ hash }: { hash: string }): void => {
      const from = String(tempPath);
      const to = String(hashDirFor({ packageRoot: WEB_ROOT, hash }));
      rename.rejects({
        from,
        to,
        error: FsErrorStub({ code: 'ENOTEMPTY', syscall: 'rename', path: from }),
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
        path: String(hashDirFor({ packageRoot, hash })),
        exists: true,
      });
    },

    bundleDirFor: ({
      packageRoot,
      hash,
    }: {
      packageRoot: AbsoluteFilePath;
      hash: string;
    }): AbsoluteFilePath => hashDirFor({ packageRoot, hash }),

    getBuildCalls: (): readonly unknown[][] =>
      run.getCallsFor({ script: 'build', args: ['--', '--outDir', String(tempPath)] }),

    getRemovedTempPaths: (): readonly unknown[][] => rm.getCallsFor({ path: String(tempPath) }),

    getPublishCalls: (): readonly unknown[][] =>
      rename.getCallsFor({
        from: String(tempPath),
        to: (p: unknown): boolean => typeof p === 'string',
      }),
  };
};
