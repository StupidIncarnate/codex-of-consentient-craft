import { listSourceFilesLayerBrokerProxy } from './list-source-files-layer-broker.proxy';
import { stateDirsFindLayerBrokerProxy } from './state-dirs-find-layer-broker.proxy';
import { readSourceFileLayerBrokerProxy } from './read-source-file-layer-broker.proxy';

export const architectureStateWritesBrokerProxy = (): {
  setupSourceFiles: ({
    packageRoot,
    filePaths,
    contents,
    stateDirNames,
  }: {
    packageRoot: string;
    filePaths: string[];
    contents: string[];
    stateDirNames: string[];
  }) => void;
  setupEmpty: ({ packageRoot }: { packageRoot: string }) => void;
} => {
  const sourceFilesProxy = listSourceFilesLayerBrokerProxy();
  const stateDirsProxy = stateDirsFindLayerBrokerProxy();
  const readFileProxy = readSourceFileLayerBrokerProxy();

  return {
    setupSourceFiles: ({
      packageRoot,
      filePaths,
      contents,
      stateDirNames,
    }: {
      packageRoot: string;
      filePaths: string[];
      contents: string[];
      stateDirNames: string[];
    }): void => {
      const srcPath = `${packageRoot}/src`;
      sourceFilesProxy.setupFlatDirectory({ dirPath: srcPath, filePaths });
      stateDirsProxy.setupStateDirs({ packageRoot, names: stateDirNames });
      contents.forEach((content, index) => {
        const filePath = filePaths[index];
        if (filePath === undefined) return;
        readFileProxy.setupReturns({ filePath, content });
      });
    },

    setupEmpty: ({ packageRoot }: { packageRoot: string }): void => {
      const srcPath = `${packageRoot}/src`;
      sourceFilesProxy.setupEmpty({ dirPath: srcPath });
      stateDirsProxy.setupEmpty({ packageRoot });
    },
  };
};
