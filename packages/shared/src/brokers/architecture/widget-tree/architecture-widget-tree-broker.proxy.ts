import { listWidgetFilesLayerBrokerProxy } from './list-widget-files-layer-broker.proxy';
import { findRootWidgetImportsLayerBrokerProxy } from './find-root-widget-imports-layer-broker.proxy';
import { extractWidgetEdgesLayerBrokerProxy } from './extract-widget-edges-layer-broker.proxy';
import { buildWidgetNodeLayerBrokerProxy } from './build-widget-node-layer-broker.proxy';
import { widgetTreeStatics } from '../../../statics/widget-tree/widget-tree-statics';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';

export const architectureWidgetTreeBrokerProxy = (): {
  setupPackage: ({
    packageRoot,
    widgetFilePaths,
    widgetSources,
    responderFilePaths,
    responderContents,
    flowFilePaths,
    flowContents,
  }: {
    packageRoot: AbsoluteFilePath;
    widgetFilePaths: AbsoluteFilePath[];
    widgetSources: ContentText[];
    responderFilePaths: AbsoluteFilePath[];
    responderContents: ContentText[];
    flowFilePaths: AbsoluteFilePath[];
    flowContents: ContentText[];
  }) => void;
  setupEmpty: ({ packageRoot }: { packageRoot: AbsoluteFilePath }) => void;
} => {
  const listWidgetsProxy = listWidgetFilesLayerBrokerProxy();
  const findRootImportsProxy = findRootWidgetImportsLayerBrokerProxy();
  const extractEdgesProxy = extractWidgetEdgesLayerBrokerProxy();
  buildWidgetNodeLayerBrokerProxy();

  return {
    setupPackage: ({
      packageRoot,
      widgetFilePaths,
      widgetSources,
      responderFilePaths,
      responderContents,
      flowFilePaths,
      flowContents,
    }: {
      packageRoot: AbsoluteFilePath;
      widgetFilePaths: AbsoluteFilePath[];
      widgetSources: ContentText[];
      responderFilePaths: AbsoluteFilePath[];
      responderContents: ContentText[];
      flowFilePaths: AbsoluteFilePath[];
      flowContents: ContentText[];
    }): void => {
      const packageSrcPath = AbsoluteFilePathStub({ value: `${String(packageRoot)}/src` });
      const widgetsDirPath = AbsoluteFilePathStub({
        value: `${String(packageSrcPath)}/${widgetTreeStatics.widgetsFolderName}`,
      });

      // readdir call 1: widgets dir
      listWidgetsProxy.setupFlatWidgetsDir({ widgetsDirPath, filePaths: widgetFilePaths });

      // readFile calls: widget sources (one per entry widget for edge extraction)
      widgetFilePaths.forEach((filePath, i) => {
        const content = widgetSources[i];
        if (content === undefined) return;
        extractEdgesProxy.setupWidgetSource({ filePath, content });
      });

      // readdir call 2: responders dir; readdir call 3: flows dir
      // readFile calls: responder then flow sources
      findRootImportsProxy.setupRootSources({
        packageSrcPath,
        responderFilePaths,
        responderContents,
        flowFilePaths,
        flowContents,
      });
    },

    setupEmpty: ({ packageRoot }: { packageRoot: AbsoluteFilePath }): void => {
      const packageSrcPath = AbsoluteFilePathStub({ value: `${String(packageRoot)}/src` });
      const widgetsDirPath = AbsoluteFilePathStub({
        value: `${String(packageSrcPath)}/${widgetTreeStatics.widgetsFolderName}`,
      });
      listWidgetsProxy.setupEmpty({ widgetsDirPath });
    },
  };
};
