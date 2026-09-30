import { listWidgetFilesLayerBrokerProxy } from './list-widget-files-layer-broker.proxy';
import { findRootWidgetImportsLayerBrokerProxy } from './find-root-widget-imports-layer-broker.proxy';
import { extractWidgetEdgesLayerBrokerProxy } from './extract-widget-edges-layer-broker.proxy';
import { buildWidgetNodeLayerBrokerProxy } from './build-widget-node-layer-broker.proxy';
import { widgetTreeStatics } from '../../../statics/widget-tree/widget-tree-statics';

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
    packageRoot: string;
    widgetFilePaths: string[];
    widgetSources: string[];
    responderFilePaths: string[];
    responderContents: string[];
    flowFilePaths: string[];
    flowContents: string[];
  }) => void;
  setupEmpty: ({ packageRoot }: { packageRoot: string }) => void;
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
      packageRoot: string;
      widgetFilePaths: string[];
      widgetSources: string[];
      responderFilePaths: string[];
      responderContents: string[];
      flowFilePaths: string[];
      flowContents: string[];
    }): void => {
      const packageSrcPath = `${String(packageRoot)}/src`;
      const widgetsDirPath = `${String(packageSrcPath)}/${widgetTreeStatics.widgetsFolderName}`;

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

    setupEmpty: ({ packageRoot }: { packageRoot: string }): void => {
      const packageSrcPath = `${String(packageRoot)}/src`;
      const widgetsDirPath = `${String(packageSrcPath)}/${widgetTreeStatics.widgetsFolderName}`;
      listWidgetsProxy.setupEmpty({ widgetsDirPath });
    },
  };
};
