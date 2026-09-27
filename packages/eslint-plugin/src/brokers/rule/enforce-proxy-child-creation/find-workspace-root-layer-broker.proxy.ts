import { FilePathStub, FileContentsStub } from '@dungeonmaster/shared/contracts';
import { fsExistsSyncAdapterProxy } from '../../../adapters/fs/exists-sync/fs-exists-sync-adapter.proxy';
import { fsReadFileSyncAdapterProxy } from '../../../adapters/fs/read-file-sync/fs-read-file-sync-adapter.proxy';
import { pathJoinAdapterProxy } from '../../../adapters/path/join/path-join-adapter.proxy';
import { pathDirnameAdapterProxy } from '../../../adapters/path/dirname/path-dirname-adapter.proxy';

export const findWorkspaceRootLayerBrokerProxy = (): {
  setupWorkspaceRoot: (args: { rootDir: string; packageNames: string[] }) => void;
  setupNonRootPackageJson: (args: { packageDir: string }) => void;
} => {
  const existsProxy = fsExistsSyncAdapterProxy();
  const readProxy = fsReadFileSyncAdapterProxy();
  // Real passthrough default: no explicit staging.
  pathJoinAdapterProxy();
  pathDirnameAdapterProxy();

  // No single path to key on: the walk probes every ancestor directory, so the honest catch-all is
  // "nothing exists" and each test stages the one it needs.
  existsProxy.setupFileSystem(() => false);

  return {
    setupWorkspaceRoot: ({
      rootDir,
      packageNames,
    }: {
      rootDir: string;
      packageNames: string[];
    }): void => {
      const packageJsonPath = FilePathStub({ value: `${rootDir}/package.json` });
      existsProxy.returns({ filePath: packageJsonPath, exists: true });
      readProxy.returns({
        filePath: packageJsonPath,
        contents: FileContentsStub({
          value: JSON.stringify({
            name: 'dungeonmaster',
            workspaces: ['packages/*'],
            dependencies: Object.fromEntries(packageNames.map((name) => [name, '*'])),
          }),
        }),
      });
    },

    // An ordinary package.json (no `workspaces` field) so the walk keeps climbing past it.
    setupNonRootPackageJson: ({ packageDir }: { packageDir: string }): void => {
      const packageJsonPath = FilePathStub({ value: `${packageDir}/package.json` });
      existsProxy.returns({ filePath: packageJsonPath, exists: true });
      readProxy.returns({
        filePath: packageJsonPath,
        contents: FileContentsStub({ value: JSON.stringify({ name: '@dungeonmaster/some-pkg' }) }),
      });
    },
  };
};
