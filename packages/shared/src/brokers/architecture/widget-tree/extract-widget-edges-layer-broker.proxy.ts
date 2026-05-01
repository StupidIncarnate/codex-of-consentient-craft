import { readWidgetSourceLayerBrokerProxy } from './read-widget-source-layer-broker.proxy';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';

export const extractWidgetEdgesLayerBrokerProxy = (): {
  setupWidgetSource: ({ content }: { content: ContentText }) => void;
  setupMissingWidget: () => void;
} => {
  const readSourceProxy = readWidgetSourceLayerBrokerProxy();

  return {
    setupWidgetSource: ({ content }: { content: ContentText }): void => {
      readSourceProxy.setupReturns({ content });
    },

    setupMissingWidget: (): void => {
      readSourceProxy.setupMissing();
    },
  };
};
