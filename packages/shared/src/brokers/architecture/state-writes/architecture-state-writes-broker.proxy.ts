import { listSourceFilesLayerBrokerProxy } from './list-source-files-layer-broker.proxy';
import { stateDirsFindLayerBrokerProxy } from './state-dirs-find-layer-broker.proxy';
import { readSourceFileLayerBrokerProxy } from './read-source-file-layer-broker.proxy';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';

export const architectureStateWritesBrokerProxy = (): {
  setupSourceFiles: ({
    packageRoot,
    filePaths,
    contents,
    stateDirNames,
  }: {
    packageRoot: AbsoluteFilePath;
    filePaths: AbsoluteFilePath[];
    contents: ContentText[];
    stateDirNames: string[];
  }) => void;
  setupEmpty: ({ packageRoot }: { packageRoot: AbsoluteFilePath }) => void;
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
      packageRoot: AbsoluteFilePath;
      filePaths: AbsoluteFilePath[];
      contents: ContentText[];
      stateDirNames: string[];
    }): void => {
      const srcPath = AbsoluteFilePathStub({ value: `${String(packageRoot)}/src` });
      sourceFilesProxy.setupFlatDirectory({ dirPath: srcPath, filePaths });
      stateDirsProxy.setupStateDirs({ packageRoot, names: stateDirNames });
      contents.forEach((content, index) => {
        const filePath = filePaths[index];
        if (filePath === undefined) return;
        readFileProxy.setupReturns({ filePath, content });
      });
    },

    setupEmpty: ({ packageRoot }: { packageRoot: AbsoluteFilePath }): void => {
      const srcPath = AbsoluteFilePathStub({ value: `${String(packageRoot)}/src` });
      sourceFilesProxy.setupEmpty({ dirPath: srcPath });
      stateDirsProxy.setupEmpty({ packageRoot });
    },
  };
};
