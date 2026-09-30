import { architectureExportNameResolveBrokerProxy } from '../export-name-resolve/architecture-export-name-resolve-broker.proxy';
import { importsInFolderTypeFindLayerBrokerProxy } from './imports-in-folder-type-find-layer-broker.proxy';
import { callChainLinesRenderLayerBrokerProxy } from './call-chain-lines-render-layer-broker.proxy';
import { routeMetadataExtractLayerBrokerProxy } from './route-metadata-extract-layer-broker.proxy';
import { widgetSubtreeRenderLayerBrokerProxy } from './widget-subtree-render-layer-broker.proxy';
import { busEventLinesRenderLayerBrokerProxy } from './bus-event-lines-render-layer-broker.proxy';
import { FileMissingErrorStub } from '#gateway/node/fs/file-missing-error/file-missing-error.stub';

export const responderLinesRenderLayerBrokerProxy = (): {
  setupFlowSource: ({ sourceFile, content }: { sourceFile: string; content: string }) => void;
  setupFlowMissing: ({ sourceFile }: { sourceFile: string }) => void;
  setupFlowImplementation: ({ fn }: { fn: (filePath: string) => string }) => void;
  setupFileContentsMap: ({ map }: { map: Record<string, string> }) => void;
} => {
  const flowImportsProxy = importsInFolderTypeFindLayerBrokerProxy();
  const callChainProxy = callChainLinesRenderLayerBrokerProxy();
  const routeMetadataProxy = routeMetadataExtractLayerBrokerProxy();
  // architectureExportNameResolveBroker shares the underlying fs-read-file fake with
  // the call-chain and imports proxies, so registering this proxy keeps the lint rule
  // satisfied while the proxies all draw from one fs implementation.
  architectureExportNameResolveBrokerProxy();
  widgetSubtreeRenderLayerBrokerProxy();
  busEventLinesRenderLayerBrokerProxy();

  const buildImpl =
    (map: Record<string, string>) =>
    (filePath: string): string => {
      const fp = filePath;
      for (const [suffix, content] of Object.entries(map)) {
        if (fp.endsWith(suffix)) {
          return content;
        }
      }
      throw FileMissingErrorStub({ path: fp });
    };

  return {
    setupFlowSource: ({ sourceFile, content }: { sourceFile: string; content: string }): void => {
      flowImportsProxy.setupSource({ sourceFile, content });
    },

    setupFlowMissing: ({ sourceFile }: { sourceFile: string }): void => {
      flowImportsProxy.setupMissing({ sourceFile });
    },

    setupFlowImplementation: ({ fn }: { fn: (filePath: string) => string }): void => {
      flowImportsProxy.setupImplementation({ fn });
    },

    setupFileContentsMap: ({ map }: { map: Record<string, string> }): void => {
      callChainProxy.setupFileContentsMap({ map });
      routeMetadataProxy.setupImplementation({ fn: buildImpl(map) });
    },
  };
};
