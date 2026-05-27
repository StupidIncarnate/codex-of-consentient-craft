import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';

export const tsconfigPairWriteLayerBrokerProxy = (): {
  captureWrites: () => readonly { path: unknown; content: unknown }[];
} => {
  const writeProxy = fsWriteFileAdapterProxy();

  return {
    captureWrites: (): readonly { path: unknown; content: unknown }[] =>
      writeProxy.getAllWrittenFiles(),
  };
};
