import { collectFolderFilesLayerBrokerProxy } from './collect-folder-files-layer-broker.proxy';
import { readWidgetSourceLayerBrokerProxy } from './read-widget-source-layer-broker.proxy';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';

export const findRootWidgetImportsLayerBrokerProxy = (): {
  setupRootSources: ({
    responderFilePaths,
    responderContents,
    flowFilePaths,
    flowContents,
  }: {
    responderFilePaths: AbsoluteFilePath[];
    responderContents: ContentText[];
    flowFilePaths: AbsoluteFilePath[];
    flowContents: ContentText[];
  }) => void;
  setupEmpty: () => void;
} => {
  const folderFilesProxy = collectFolderFilesLayerBrokerProxy();
  const readSourceProxy = readWidgetSourceLayerBrokerProxy();

  return {
    setupRootSources: ({
      responderFilePaths,
      responderContents,
      flowFilePaths,
      flowContents,
    }: {
      responderFilePaths: AbsoluteFilePath[];
      responderContents: ContentText[];
      flowFilePaths: AbsoluteFilePath[];
      flowContents: ContentText[];
    }): void => {
      // readdir call for responders dir
      folderFilesProxy.setupFlatDirectory({ filePaths: responderFilePaths });
      // readdir call for flows dir
      folderFilesProxy.setupFlatDirectory({ filePaths: flowFilePaths });
      // readFile calls: responder sources then flow sources
      for (const content of responderContents) {
        readSourceProxy.setupReturns({ content });
      }
      for (const content of flowContents) {
        readSourceProxy.setupReturns({ content });
      }
    },

    setupEmpty: (): void => {
      folderFilesProxy.setupEmpty();
      folderFilesProxy.setupEmpty();
    },
  };
};
