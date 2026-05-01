import { listWidgetFilesLayerBrokerProxy } from './list-widget-files-layer-broker.proxy';
import { findRootWidgetImportsLayerBrokerProxy } from './find-root-widget-imports-layer-broker.proxy';
import { extractWidgetEdgesLayerBrokerProxy } from './extract-widget-edges-layer-broker.proxy';
import { buildWidgetNodeLayerBrokerProxy } from './build-widget-node-layer-broker.proxy';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';

export const architectureWidgetTreeBrokerProxy = (): {
  setupPackage: ({
    widgetFilePaths,
    widgetSources,
    responderFilePaths,
    responderContents,
    flowFilePaths,
    flowContents,
  }: {
    widgetFilePaths: AbsoluteFilePath[];
    widgetSources: ContentText[];
    responderFilePaths: AbsoluteFilePath[];
    responderContents: ContentText[];
    flowFilePaths: AbsoluteFilePath[];
    flowContents: ContentText[];
  }) => void;
  setupEmpty: () => void;
} => {
  const listWidgetsProxy = listWidgetFilesLayerBrokerProxy();
  const findRootImportsProxy = findRootWidgetImportsLayerBrokerProxy();
  const extractEdgesProxy = extractWidgetEdgesLayerBrokerProxy();
  buildWidgetNodeLayerBrokerProxy();

  return {
    setupPackage: ({
      widgetFilePaths,
      widgetSources,
      responderFilePaths,
      responderContents,
      flowFilePaths,
      flowContents,
    }: {
      widgetFilePaths: AbsoluteFilePath[];
      widgetSources: ContentText[];
      responderFilePaths: AbsoluteFilePath[];
      responderContents: ContentText[];
      flowFilePaths: AbsoluteFilePath[];
      flowContents: ContentText[];
    }): void => {
      // readdir call 1: widgets dir
      listWidgetsProxy.setupFlatWidgetsDir({ filePaths: widgetFilePaths });

      // readFile calls: widget sources (one per entry widget for edge extraction)
      for (const content of widgetSources) {
        extractEdgesProxy.setupWidgetSource({ content });
      }

      // readdir call 2: responders dir; readdir call 3: flows dir
      // readFile calls: responder then flow sources
      findRootImportsProxy.setupRootSources({
        responderFilePaths,
        responderContents,
        flowFilePaths,
        flowContents,
      });
    },

    setupEmpty: (): void => {
      listWidgetsProxy.setupEmpty();
    },
  };
};
