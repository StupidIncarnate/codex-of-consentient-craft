import { readWidgetSourceLayerBrokerProxy } from './read-widget-source-layer-broker.proxy';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';

export const extractWidgetEdgesLayerBrokerProxy = (): {
  setupWidgetSource: ({
    filePath,
    content,
  }: {
    filePath: AbsoluteFilePath;
    content: ContentText;
  }) => void;
  setupMissingWidget: ({ filePath }: { filePath: AbsoluteFilePath }) => void;
} => {
  const readSourceProxy = readWidgetSourceLayerBrokerProxy();

  return {
    setupWidgetSource: ({
      filePath,
      content,
    }: {
      filePath: AbsoluteFilePath;
      content: ContentText;
    }): void => {
      readSourceProxy.setupReturns({ filePath, content });
    },

    setupMissingWidget: ({ filePath }: { filePath: AbsoluteFilePath }): void => {
      readSourceProxy.setupMissing({ filePath });
    },
  };
};
