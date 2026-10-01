import { join } from '#gateway/node/path';
import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';
import { writeFileProxy } from '#gateway/node/fs__promises/write-file/write-file.proxy';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';
import { packageDiscoverBrokerProxy } from '../../../brokers/package/discover/package-discover-broker.proxy';
import { InstallAddDevDepsResponder } from './install-add-dev-deps-responder';

export const InstallAddDevDepsResponderProxy = (): {
  callResponder: typeof InstallAddDevDepsResponder;
  setupFileExists: (params: { filePath: string }) => void;
  setupFileNotExists: (params: { filePath: string }) => void;
  setupReadFile: (params: { filePath: string; content: string }) => void;
  setupDungeonmasterPackages: (params: {
    packagesPath: string;
    packages: { name: string; group?: string }[];
  }) => void;
  getWrittenFiles: () => readonly { path: unknown; content: unknown }[];
} => {
  const discoverProxy = packageDiscoverBrokerProxy();
  const existsProxy = existsSyncProxy();
  const readProxy = readFileProxy();
  const writeProxy = writeFileProxy();
  const realPath = requireActual<{ join: typeof join }>({ module: 'path' });
  const joinHandle = registerMock({ fn: join });
  joinHandle.calledWith([]).implement((...segments: never[]) => realPath.join(...segments));
  const writtenPaths: string[] = [];

  return {
    callResponder: InstallAddDevDepsResponder,

    setupFileExists: ({ filePath }: { filePath: string }): void => {
      existsProxy.returns({ path: filePath, exists: true });
    },

    setupFileNotExists: ({ filePath }: { filePath: string }): void => {
      existsProxy.returns({ path: filePath, exists: false });
    },

    setupReadFile: ({ filePath, content }: { filePath: string; content: string }): void => {
      readProxy.returns({ path: filePath, contents: content });
      writeProxy.succeeds({ path: filePath });
      writtenPaths.push(filePath);
    },

    // Every package named here holds a standard `dist/startup/start-install.js`; one with a
    // `group` sits nested under that `@group` folder, the way packages/@gateway/npm does.
    setupDungeonmasterPackages: ({
      packagesPath,
      packages,
    }: {
      packagesPath: string;
      packages: { name: string; group?: string }[];
    }): void => {
      const leaves = packages.filter((pkg) => pkg.group === undefined);
      const groups = [
        ...new Set(packages.flatMap((pkg) => (pkg.group === undefined ? [] : [pkg.group]))),
      ];
      discoverProxy.setupPackageDiscovery({
        packagesPath,
        packages: [
          ...leaves.map(({ name }) => ({
            name,
            standardPath: `${packagesPath}/${name}/dist/startup/start-install.js`,
            installerLocation: 'standard' as const,
          })),
          ...groups.map((group) => ({
            name: group,
            children: packages
              .filter((pkg) => pkg.group === group)
              .map(({ name }) => ({
                name,
                standardPath: `${packagesPath}/${group}/${name}/dist/startup/start-install.js`,
                installerLocation: 'standard' as const,
              })),
          })),
        ],
      });
    },

    getWrittenFiles: (): readonly { path: unknown; content: unknown }[] =>
      writtenPaths.flatMap((path) => {
        const content = writeProxy.writtenContentsFor({ path });
        return content === undefined ? [] : [{ path, content }];
      }),
  };
};
