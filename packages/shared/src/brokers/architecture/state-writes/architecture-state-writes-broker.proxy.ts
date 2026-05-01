import { listSourceFilesLayerBrokerProxy } from './list-source-files-layer-broker.proxy';
import { stateDirsFindLayerBrokerProxy } from './state-dirs-find-layer-broker.proxy';
import { readSourceFileLayerBrokerProxy } from './read-source-file-layer-broker.proxy';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';

export const architectureStateWritesBrokerProxy = (): {
  setupSourceFiles: ({
    filePaths,
    contents,
    stateDirNames,
  }: {
    filePaths: AbsoluteFilePath[];
    contents: ContentText[];
    stateDirNames: string[];
  }) => void;
  setupEmpty: () => void;
} => {
  const sourceFilesProxy = listSourceFilesLayerBrokerProxy();
  const stateDirsProxy = stateDirsFindLayerBrokerProxy();
  const readFileProxy = readSourceFileLayerBrokerProxy();

  return {
    setupSourceFiles: ({
      filePaths,
      contents,
      stateDirNames,
    }: {
      filePaths: AbsoluteFilePath[];
      contents: ContentText[];
      stateDirNames: string[];
    }): void => {
      sourceFilesProxy.setupFlatDirectory({ filePaths });
      stateDirsProxy.setupStateDirs({ names: stateDirNames });
      for (const content of contents) {
        readFileProxy.setupReturns({ content });
      }
    },

    setupEmpty: (): void => {
      sourceFilesProxy.setupEmpty();
      stateDirsProxy.setupEmpty();
    },
  };
};
