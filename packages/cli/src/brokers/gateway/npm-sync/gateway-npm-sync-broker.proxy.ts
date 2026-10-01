import { cp } from '#gateway/node/fs__promises';
import { runProxy } from '#gateway/node/child_process/run/run.proxy';
import { pathExistsProxy } from '#gateway/node/fs__promises/path-exists/path-exists.proxy';
import { readJsonFileIfExistsProxy } from '#gateway/node/fs__promises/read-json-file-if-exists/read-json-file-if-exists.proxy';
import { readdirEntriesProxy } from '#gateway/node/fs__promises/readdir-entries/readdir-entries.proxy';
import { unlinkIfExistsProxy } from '#gateway/node/fs__promises/unlink-if-exists/unlink-if-exists.proxy';
import { writeFileCreatingParentProxy } from '#gateway/node/fs__promises/write-file-creating-parent/write-file-creating-parent.proxy';
import { resolvePackageRoot } from '#gateway/node/module';
import { resolvePackageRootProxy } from '#gateway/node/module/resolve-package-root/resolve-package-root.proxy';
import { getEnvProxy } from '#gateway/node/process/get-env/get-env.proxy';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { gatewayNpmDependenciesListBrokerProxy } from '../npm-dependencies-list/gateway-npm-dependencies-list-broker.proxy';
import { gatewayPackageRecordLayerBrokerProxy } from './gateway-package-record-layer-broker.proxy';
import { ownCopyGateLayerBrokerProxy } from './own-copy-gate-layer-broker.proxy';
import { ownCopyPlanLayerBrokerProxy } from './own-copy-plan-layer-broker.proxy';
import { passthroughPlanLayerBrokerProxy } from './passthrough-plan-layer-broker.proxy';
import { subpathFoldersOwnedLayerBrokerProxy } from './subpath-folders-owned-layer-broker.proxy';

const INSTALL_ARGS = ['install', '--ignore-scripts', '--no-audit', '--no-fund'];

export const gatewayNpmSyncBrokerProxy = (): {
  ownSrcRoot: () => string;
  setupNoGateway: (params: { repoRoot: string }) => void;
  setupSync: (params: {
    repoRoot: string;
    npmCommand: string;
    rootPackageJson: Record<string, unknown>;
    consumerFolders: readonly string[] | null;
    consumerBarrels?: Readonly<Record<string, string>>;
    ownFolders: Readonly<Record<string, Readonly<Record<string, string>>>>;
    gatewayPackageJson: Record<string, unknown>;
    passthroughFolders: readonly string[];
    ownRanges?: Readonly<Record<string, string>>;
    installedVersions?: Readonly<Record<string, string | null>>;
  }) => void;
  setupInstallFails: (params: { repoRoot: string; output: string }) => void;
  writtenFiles: (params: { repoRoot: string; folder: string }) => readonly unknown[];
  copiedFolders: () => readonly unknown[][];
  writtenGatewayPackageJson: (params: { repoRoot: string }) => unknown;
  removedPaths: (params: { repoRoot: string }) => readonly unknown[][];
  installCalls: () => readonly string[][];
} => {
  resolvePackageRootProxy();
  const existsProxy = pathExistsProxy();
  const dependenciesProxy = gatewayNpmDependenciesListBrokerProxy();
  const entriesProxy = readdirEntriesProxy();
  const planProxy = ownCopyPlanLayerBrokerProxy();
  const gateProxy = ownCopyGateLayerBrokerProxy();
  const ownManifestProxy = readJsonFileIfExistsProxy();
  const consumerSubpathsProxy = subpathFoldersOwnedLayerBrokerProxy();
  passthroughPlanLayerBrokerProxy();
  const envProxy = getEnvProxy();
  const cpHandle = registerMock({ fn: cp });
  const writeProxy = writeFileCreatingParentProxy();
  const unlinkProxy = unlinkIfExistsProxy();
  const recordProxy = gatewayPackageRecordLayerBrokerProxy();
  const installProxy = runProxy();

  const ownPackageRoot = String(
    resolvePackageRoot({ specifier: '@dungeonmaster/npm/package.json' }),
  );
  const resolveOwnSrcRoot = (): string => `${ownPackageRoot}/src`;

  return {
    ownSrcRoot: resolveOwnSrcRoot,

    setupNoGateway: ({ repoRoot }): void => {
      existsProxy.missing({ path: `${repoRoot}/packages/@gateway/npm/package.json` });
    },

    setupSync: ({
      repoRoot,
      npmCommand,
      rootPackageJson,
      consumerFolders,
      consumerBarrels,
      ownFolders,
      gatewayPackageJson,
      passthroughFolders,
      ownRanges,
      installedVersions,
    }): void => {
      const npmPackageRoot = `${repoRoot}/packages/@gateway/npm`;
      const srcRoot = `${npmPackageRoot}/src`;
      const ownSrcRoot = resolveOwnSrcRoot();

      existsProxy.present({ path: `${npmPackageRoot}/package.json` });
      dependenciesProxy.setupRepo({
        repoRoot,
        rootPackageJson,
        workspacePackages: [],
        gatewayPackages: [],
      });
      if (consumerFolders === null) {
        existsProxy.missing({ path: srcRoot });
      } else {
        existsProxy.present({ path: srcRoot });
        entriesProxy.returns({
          path: srcRoot,
          entries: [
            ...consumerFolders.map((name) => ({ name, kind: 'directory' as const })),
            { name: 'index.d.ts', kind: 'file' as const },
          ],
        });
      }
      consumerSubpathsProxy.setupBarrels({ srcRoot, barrels: consumerBarrels ?? {} });
      planProxy.setupOwnGateway({ ownSrcRoot, folders: ownFolders });
      // Unless a test says otherwise, every dependency is installed at 1.0.0 and our own
      // package.json accepts any version of it, so only the compile gate decides a copy.
      const declared = rootPackageJson.dependencies;
      const dependencyNames =
        typeof declared === 'object' && declared !== null ? Object.keys(declared) : [];
      ownManifestProxy.returnsRaw({
        path: `${ownPackageRoot}/package.json`,
        rawContents: JSON.stringify({
          name: '@dungeonmaster/npm',
          dependencies: ownRanges ?? Object.fromEntries(dependencyNames.map((name) => [name, '*'])),
        }),
      });
      for (const name of dependencyNames) {
        gateProxy.setupInstalled({
          repoRoot,
          packageName: name,
          version: installedVersions === undefined ? '1.0.0' : (installedVersions[name] ?? null),
        });
      }
      envProxy.setupEnv({ name: 'npm_command', value: npmCommand });

      for (const folder of Object.keys(ownFolders)) {
        cpHandle
          .calledWith([`${ownSrcRoot}/${folder}`, `${srcRoot}/${folder}`, { recursive: true }])
          .resolves(undefined);
      }
      for (const folder of passthroughFolders) {
        writeProxy.succeeds({ path: `${srcRoot}/${folder}/${folder}.ts` });
        writeProxy.succeeds({ path: `${srcRoot}/${folder}/${folder}.test.ts` });
      }
      unlinkProxy.succeeds({ path: `${npmPackageRoot}/src/index.d.ts` });
      recordProxy.setupPackageJson({ npmPackageRoot, packageJson: gatewayPackageJson });
      installProxy.setupSuccess({
        command: 'npm',
        args: INSTALL_ARGS,
        cwd: repoRoot,
        exitCode: 0,
        stdout: '',
        stderr: '',
      });
    },

    setupInstallFails: ({ repoRoot, output }): void => {
      installProxy.setupSuccess({
        command: 'npm',
        args: INSTALL_ARGS,
        cwd: repoRoot,
        exitCode: 1,
        stdout: '',
        stderr: output,
      });
    },

    writtenFiles: ({ repoRoot, folder }): readonly unknown[] => {
      const folderPath = `${repoRoot}/packages/@gateway/npm/src/${folder}`;
      return [
        writeProxy.writtenContentsFor({ path: `${folderPath}/${folder}.ts` }),
        writeProxy.writtenContentsFor({ path: `${folderPath}/${folder}.test.ts` }),
      ];
    },

    copiedFolders: (): readonly unknown[][] => cpHandle.callsMatching([]).map((call) => [...call]),

    writtenGatewayPackageJson: ({ repoRoot }): unknown =>
      recordProxy.writtenPackageJson({ npmPackageRoot: `${repoRoot}/packages/@gateway/npm` }),

    removedPaths: ({ repoRoot }): readonly unknown[][] =>
      unlinkProxy.getCallsFor({ path: `${repoRoot}/packages/@gateway/npm/src/index.d.ts` }),

    installCalls: (): readonly string[][] => installProxy.getCallsFor({ command: 'npm' }),
  };
};
