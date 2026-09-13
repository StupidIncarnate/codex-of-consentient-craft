import { FilePathStub } from '@dungeonmaster/shared/contracts';

import { fsReadFileRangeAdapterProxy } from '../../../adapters/fs/read-file-range/fs-read-file-range-adapter.proxy';

export const foldBatchLayerBrokerProxy = (): {
  setupTranscript: (params: { path: string; contents: string }) => void;
  setupUnreadableTranscript: (params: { path: string }) => void;
} => {
  const rangeProxy = fsReadFileRangeAdapterProxy();

  return {
    setupTranscript: ({ path, contents }: { path: string; contents: string }): void => {
      rangeProxy.setupFile({ filePath: FilePathStub({ value: path }), contents });
    },

    setupUnreadableTranscript: ({ path }: { path: string }): void => {
      rangeProxy.setupOpenFailure({
        filePath: FilePathStub({ value: path }),
        error: new Error('EACCES: permission denied'),
      });
    },
  };
};
