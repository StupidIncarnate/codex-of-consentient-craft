import { readWidgetSourceLayerBrokerProxy } from './read-widget-source-layer-broker.proxy';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';

export const extractWidgetEdgesLayerBrokerProxy = (): {
  setupWidgetSource: ({
    filePath,
    content,
  }: {
    filePath: string;
    content: ContentText;
  }) => void;
  setupMissingWidget: ({ filePath }: { filePath: string }) => void;
} => {
  const readSourceProxy = readWidgetSourceLayerBrokerProxy();

  return {
    setupWidgetSource: ({
      filePath,
      content,
    }: {
      filePath: string;
      content: ContentText;
    }): void => {
      readSourceProxy.setupReturns({ filePath, content });
    },

    setupMissingWidget: ({ filePath }: { filePath: string }): void => {
      readSourceProxy.setupMissing({ filePath });
    },
  };
};
