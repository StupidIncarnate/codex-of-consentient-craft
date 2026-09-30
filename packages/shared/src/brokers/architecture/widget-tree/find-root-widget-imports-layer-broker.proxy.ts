import { collectFolderFilesLayerBrokerProxy } from './collect-folder-files-layer-broker.proxy';
import { readWidgetSourceLayerBrokerProxy } from './read-widget-source-layer-broker.proxy';
import { widgetTreeStatics } from '../../../statics/widget-tree/widget-tree-statics';

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
    responderContents: string[];
    flowFilePaths: string[];
    flowContents: string[];
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
      responderContents: string[];
      flowFilePaths: string[];
      flowContents: string[];
    }): void => {
      // readdir call for responders dir
      folderFilesProxy.setupFlatDirectory({
        dirPath: `${packageSrcPath}/${respondersFolder}`,
        filePaths: responderFilePaths,
      });
      // readdir call for flows dir
      folderFilesProxy.setupFlatDirectory({
        dirPath: `${packageSrcPath}/${flowsFolder}`,
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
        dirPath: `${packageSrcPath}/${respondersFolder}`,
      });
      folderFilesProxy.setupEmpty({
        dirPath: `${packageSrcPath}/${flowsFolder}`,
      });
    },
  };
};
