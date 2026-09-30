import { collectFolderFilesLayerBrokerProxy } from './collect-folder-files-layer-broker.proxy';
import { readWidgetSourceLayerBrokerProxy } from './read-widget-source-layer-broker.proxy';
import { widgetTreeStatics } from '../../../statics/widget-tree/widget-tree-statics';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';

export const findRootWidgetImportsLayerBrokerProxy = (): {
  setupRootSources: ({
    packageSrcPath,
    responderFilePaths,
    responderContents,
    flowFilePaths,
    flowContents,
  }: {
    packageSrcPath: string;
    responderFilePaths: string[];
    responderContents: ContentText[];
    flowFilePaths: string[];
    flowContents: ContentText[];
  }) => void;
  setupEmpty: ({ packageSrcPath }: { packageSrcPath: string }) => void;
} => {
  const folderFilesProxy = collectFolderFilesLayerBrokerProxy();
  const readSourceProxy = readWidgetSourceLayerBrokerProxy();

  const [respondersFolder, flowsFolder] = widgetTreeStatics.rootSourceFolders;

  return {
    setupRootSources: ({
      packageSrcPath,
      responderFilePaths,
      responderContents,
      flowFilePaths,
      flowContents,
    }: {
      packageSrcPath: string;
      responderFilePaths: string[];
      responderContents: ContentText[];
      flowFilePaths: string[];
      flowContents: ContentText[];
    }): void => {
      // readdir call for responders dir
      folderFilesProxy.setupFlatDirectory({
        dirPath: `${String(packageSrcPath)}/${respondersFolder}`,
        filePaths: responderFilePaths,
      });
      // readdir call for flows dir
      folderFilesProxy.setupFlatDirectory({
        dirPath: `${String(packageSrcPath)}/${flowsFolder}`,
        filePaths: flowFilePaths,
      });
      // readFile calls: responder sources then flow sources
      responderFilePaths.forEach((filePath, i) => {
        const content = responderContents[i];
        if (content === undefined) return;
        readSourceProxy.setupReturns({ filePath, content });
      });
      flowFilePaths.forEach((filePath, i) => {
        const content = flowContents[i];
        if (content === undefined) return;
        readSourceProxy.setupReturns({ filePath, content });
      });
    },

    setupEmpty: ({ packageSrcPath }: { packageSrcPath: string }): void => {
      folderFilesProxy.setupEmpty({
        dirPath: `${String(packageSrcPath)}/${respondersFolder}`,
      });
      folderFilesProxy.setupEmpty({
        dirPath: `${String(packageSrcPath)}/${flowsFolder}`,
      });
    },
  };
};
