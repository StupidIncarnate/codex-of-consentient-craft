import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';
import { copyCompileLayerBrokerProxy } from './copy-compile-layer-broker.proxy';
import { installedVersionLayerBrokerProxy } from './installed-version-layer-broker.proxy';
import { sourceFilesListLayerBrokerProxy } from './source-files-list-layer-broker.proxy';

export const ownCopyGateLayerBrokerProxy = (): {
  setupInstalled: (params: {
    repoRoot: string;
    packageName: string;
    version: string | null;
  }) => void;
  setupOwnFolder: (params: {
    ownSrcRoot: string;
    folder: string;
    files: Readonly<Record<string, string>>;
  }) => void;
} => {
  const versionProxy = installedVersionLayerBrokerProxy();
  const filesListProxy = sourceFilesListLayerBrokerProxy();
  const fileProxy = readFileProxy();
  copyCompileLayerBrokerProxy();

  return {
    // The package installed at the repo root's node_modules at `version`, or nowhere when null.
    setupInstalled: ({ repoRoot, packageName, version }): void => {
      versionProxy.setupInstalled({
        repoRoot,
        fromDirectory: `${repoRoot}/packages/@gateway/npm`,
        packageName,
        versionsByNodeModules: version === null ? {} : { [`${repoRoot}/node_modules`]: version },
      });
    },

    setupOwnFolder: ({ ownSrcRoot, folder, files }): void => {
      const dirPath = `${ownSrcRoot}/${folder}`;
      filesListProxy.setupTree({ dirPath, relativeFilePaths: Object.keys(files) });
      for (const [relativePath, contents] of Object.entries(files)) {
        fileProxy.returns({ path: `${dirPath}/${relativePath}`, contents });
      }
    },
  };
};
