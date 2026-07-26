import { filePathContract, type AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';

export const tsconfigPairWriteLayerBrokerProxy = (): {
  setupWrite: (params: { filePath: AbsoluteFilePath }) => void;
  captureWrites: () => readonly { path: unknown; content: unknown }[];
} => {
  const writeProxy = fsWriteFileAdapterProxy();

  return {
    // The broker re-parses pair.tsconfigPath (AbsoluteFilePath) through filePathContract
    // before calling fsWriteFileAdapter, so the mock is staged under that same FilePath brand.
    setupWrite: ({ filePath }: { filePath: AbsoluteFilePath }): void => {
      writeProxy.succeeds({ filePath: filePathContract.parse(String(filePath)) });
    },
    captureWrites: (): readonly { path: unknown; content: unknown }[] =>
      writeProxy.getAllWrittenFiles(),
  };
};
