import { dmJsonlAppendAdapterProxy } from '../../../adapters/dm-jsonl/append/dm-jsonl-append-adapter.proxy';

export const sessionWriteRouteBrokerProxy = (): {
  succeeds: ({ filePath }: { filePath: string }) => void;
  getAppendedContents: ({ filePath }: { filePath: string }) => unknown;
} => {
  const appendProxy = dmJsonlAppendAdapterProxy();

  return {
    succeeds: ({ filePath }: { filePath: string }): void => {
      appendProxy.succeeds({ filePath });
    },
    getAppendedContents: ({ filePath }: { filePath: string }): unknown =>
      appendProxy.getAppendedContents({ filePath }),
  };
};
