import { architectureBindingFlowTraceBrokerProxy } from '../binding-flow-trace/architecture-binding-flow-trace-broker.proxy';
import { architectureExportNameResolveBrokerProxy } from '../export-name-resolve/architecture-export-name-resolve-broker.proxy';
import { architectureWidgetNodeRenderBrokerProxy } from '../widget-node-render/architecture-widget-node-render-broker.proxy';
import { callChainLinesRenderLayerBrokerProxy } from './call-chain-lines-render-layer-broker.proxy';
import { importsInFolderTypeFindLayerBrokerProxy } from './imports-in-folder-type-find-layer-broker.proxy';

export const widgetSubtreeRenderLayerBrokerProxy = (): {
  setupSource: ({ sourceFile, content }: { sourceFile: string; content: string }) => void;
  setupMissing: ({ sourceFile }: { sourceFile: string }) => void;
  setupImplementation: ({ fn }: { fn: (filePath: string) => string }) => void;
} => {
  const importsProxy = importsInFolderTypeFindLayerBrokerProxy();
  architectureBindingFlowTraceBrokerProxy();
  architectureExportNameResolveBrokerProxy();
  architectureWidgetNodeRenderBrokerProxy();
  callChainLinesRenderLayerBrokerProxy();

  return {
    setupSource: ({ sourceFile, content }: { sourceFile: string; content: string }): void => {
      importsProxy.setupSource({ sourceFile, content });
    },
    setupMissing: ({ sourceFile }: { sourceFile: string }): void => {
      importsProxy.setupMissing({ sourceFile });
    },
    setupImplementation: ({ fn }: { fn: (filePath: string) => string }): void => {
      importsProxy.setupImplementation({ fn });
    },
  };
};
