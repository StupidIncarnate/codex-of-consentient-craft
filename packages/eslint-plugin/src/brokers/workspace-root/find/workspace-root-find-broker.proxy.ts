import { FilePathStub, FileContentsStub } from '@dungeonmaster/shared/contracts';
import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { fsReadFileSyncAdapterProxy } from '../../../adapters/fs/read-file-sync/fs-read-file-sync-adapter.proxy';
import { pathJoinAdapterProxy } from '../../../adapters/path/join/path-join-adapter.proxy';
import { pathDirnameAdapterProxy } from '../../../adapters/path/dirname/path-dirname-adapter.proxy';

export const workspaceRootFindBrokerProxy = (): {
  setupWorkspaceRoot: (args: {
    rootDir: string;
    rootPackageJsonName: string;
    packageNames: string[];
  }) => void;
  setupNonRootPackageJson: (args: { packageDir: string }) => void;
  setupNoPackageJson: (args: { dir: string }) => void;
} => {
  const existsProxy = existsSyncProxy();
  const readProxy = fsReadFileSyncAdapterProxy();
  // Real passthrough default: no explicit staging.
  pathJoinAdapterProxy();
  pathDirnameAdapterProxy();

  return {
    setupWorkspaceRoot: ({
      rootDir,
      rootPackageJsonName,
      packageNames,
    }: {
      rootDir: string;
      rootPackageJsonName: string;
      packageNames: string[];
    }): void => {
      const packageJsonPath = FilePathStub({ value: `${rootDir}/package.json` });
      existsProxy.returns({ path: packageJsonPath, exists: true });
      readProxy.returns({
        filePath: packageJsonPath,
        contents: FileContentsStub({
          value: JSON.stringify({
            name: rootPackageJsonName,
            workspaces: ['packages/*'],
            dependencies: Object.fromEntries(packageNames.map((name) => [name, '*'])),
          }),
        }),
      });
    },

    // An ordinary package.json (no `workspaces` field) so the walk keeps climbing past it.
    setupNonRootPackageJson: ({ packageDir }: { packageDir: string }): void => {
      const packageJsonPath = FilePathStub({ value: `${packageDir}/package.json` });
      existsProxy.returns({ path: packageJsonPath, exists: true });
      readProxy.returns({
        filePath: packageJsonPath,
        contents: FileContentsStub({ value: JSON.stringify({ name: '@dungeonmaster/some-pkg' }) }),
      });
    },

    // existsSyncProxy ships no address-less catch-all: a walk-to-root "nothing found" test stages
    // every ancestor level explicitly false, one call per level. Mirrors real path.join's own
    // normalization (the broker joins via pathJoinAdapter, whose default is a real passthrough):
    // a root dir ('/') must not double the leading slash.
    setupNoPackageJson: ({ dir }: { dir: string }): void => {
      const packageJsonPath = FilePathStub({
        value: dir.endsWith('/') ? `${dir}package.json` : `${dir}/package.json`,
      });
      existsProxy.returns({ path: packageJsonPath, exists: false });
    },
  };
};
