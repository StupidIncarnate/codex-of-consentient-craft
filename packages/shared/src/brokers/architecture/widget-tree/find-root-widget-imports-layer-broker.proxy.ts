import { collectFolderFilesLayerBrokerProxy } from './collect-folder-files-layer-broker.proxy';
import { readWidgetSourceLayerBrokerProxy } from './read-widget-source-layer-broker.proxy';
import { widgetTreeStatics } from '../../../statics/widget-tree/widget-tree-statics';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';

export const findRootWidgetImportsLayerBrokerProxy = (): {
  setupRootSources: ({
    packageSrcPath,
    responderFilePaths,
    responderContents,
    flowFilePaths,
    flowContents,
  }: {
    packageSrcPath: AbsoluteFilePath;
    responderFilePaths: AbsoluteFilePath[];
    responderContents: ContentText[];
    flowFilePaths: AbsoluteFilePath[];
    flowContents: ContentText[];
  }) => void;
  setupEmpty: ({ packageSrcPath }: { packageSrcPath: AbsoluteFilePath }) => void;
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
      packageSrcPath: AbsoluteFilePath;
      responderFilePaths: AbsoluteFilePath[];
      responderContents: ContentText[];
      flowFilePaths: AbsoluteFilePath[];
      flowContents: ContentText[];
    }): void => {
      // readdir call for responders dir
      folderFilesProxy.setupFlatDirectory({
        dirPath: AbsoluteFilePathStub({
          value: `${String(packageSrcPath)}/${respondersFolder}`,
        }),
        filePaths: responderFilePaths,
      });
      // readdir call for flows dir
      folderFilesProxy.setupFlatDirectory({
        dirPath: AbsoluteFilePathStub({ value: `${String(packageSrcPath)}/${flowsFolder}` }),
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

    setupEmpty: ({ packageSrcPath }: { packageSrcPath: AbsoluteFilePath }): void => {
      folderFilesProxy.setupEmpty({
        dirPath: AbsoluteFilePathStub({
          value: `${String(packageSrcPath)}/${respondersFolder}`,
        }),
      });
      folderFilesProxy.setupEmpty({
        dirPath: AbsoluteFilePathStub({ value: `${String(packageSrcPath)}/${flowsFolder}` }),
      });
    },
  };
};
