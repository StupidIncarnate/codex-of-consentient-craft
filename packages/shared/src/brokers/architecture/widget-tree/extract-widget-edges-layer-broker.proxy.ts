import { readWidgetSourceLayerBrokerProxy } from './read-widget-source-layer-broker.proxy';

export const extractWidgetEdgesLayerBrokerProxy = (): {
  setupWidgetSource: ({
    filePath,
    content,
  }: {
    filePath: string;
    content: string;
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
      content: string;
    }): void => {
      readSourceProxy.setupReturns({ filePath, content });
    },

    setupMissingWidget: ({ filePath }: { filePath: string }): void => {
      readSourceProxy.setupMissing({ filePath });
    },
  };
};
