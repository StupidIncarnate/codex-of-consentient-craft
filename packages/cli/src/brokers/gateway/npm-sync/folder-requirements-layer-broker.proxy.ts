import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';
import { npmModuleEsmOnlyBrokerProxy } from '../../npm-module/esm-only/npm-module-esm-only-broker.proxy';
import { sourceFilesListLayerBrokerProxy } from './source-files-list-layer-broker.proxy';

export const folderRequirementsLayerBrokerProxy = (): {
  setupFolder: (params: {
    ownSrcRoot: string;
    folder: string;
    files: Readonly<Record<string, string>>;
  }) => void;
} => {
  const filesListProxy = sourceFilesListLayerBrokerProxy();
  const fileProxy = readFileProxy();
  npmModuleEsmOnlyBrokerProxy();

  return {
    setupFolder: ({ ownSrcRoot, folder, files }): void => {
      const dirPath = `${ownSrcRoot}/${folder}`;
      filesListProxy.setupTree({ dirPath, relativeFilePaths: Object.keys(files) });
      for (const [relativePath, contents] of Object.entries(files)) {
        fileProxy.returns({ path: `${dirPath}/${relativePath}`, contents });
      }
    },
  };
};
