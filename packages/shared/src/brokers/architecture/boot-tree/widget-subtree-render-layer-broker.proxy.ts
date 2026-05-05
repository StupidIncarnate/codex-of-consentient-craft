import { architectureBindingFlowTraceBrokerProxy } from '../binding-flow-trace/architecture-binding-flow-trace-broker.proxy';
import { architectureExportNameResolveBrokerProxy } from '../export-name-resolve/architecture-export-name-resolve-broker.proxy';
import { architectureWidgetNodeRenderBrokerProxy } from '../widget-node-render/architecture-widget-node-render-broker.proxy';
import { callChainLinesRenderLayerBrokerProxy } from './call-chain-lines-render-layer-broker.proxy';
import { importsInFolderTypeFindLayerBrokerProxy } from './imports-in-folder-type-find-layer-broker.proxy';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';

export const widgetSubtreeRenderLayerBrokerProxy = (): {
  setupSource: ({ content }: { content: ContentText }) => void;
  setupMissing: () => void;
  setupImplementation: ({ fn }: { fn: (filePath: ContentText) => ContentText }) => void;
} => {
  const importsProxy = importsInFolderTypeFindLayerBrokerProxy();
  architectureBindingFlowTraceBrokerProxy();
  architectureExportNameResolveBrokerProxy();
  architectureWidgetNodeRenderBrokerProxy();
  callChainLinesRenderLayerBrokerProxy();

  return {
    setupSource: ({ content }: { content: ContentText }): void => {
      importsProxy.setupSource({ content });
    },
    setupMissing: (): void => {
      importsProxy.setupMissing();
    },
    setupImplementation: ({ fn }: { fn: (filePath: ContentText) => ContentText }): void => {
      importsProxy.setupImplementation({ fn });
    },
  };
};
