import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import { listFilesRecursiveLayerBrokerProxy } from './list-files-recursive-layer-broker.proxy';

export const architectureExcludedAuditBrokerProxy = (): {
  setupVirtualTree: ({ filePaths }: { filePaths: AbsoluteFilePath[] }) => void;
  setupEmpty: () => void;
} => {
  const listProxy = listFilesRecursiveLayerBrokerProxy();

  return {
    setupVirtualTree: ({ filePaths }: { filePaths: AbsoluteFilePath[] }): void => {
      listProxy.setupVirtualTree({ filePaths });
    },

    setupEmpty: (): void => {
      listProxy.setupEmpty();
    },
  };
};
