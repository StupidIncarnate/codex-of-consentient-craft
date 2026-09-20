import { dmJsonlAppendAdapterProxy } from '../../../adapters/dm-jsonl/append/dm-jsonl-append-adapter.proxy';

export const subagentWriteRouteBrokerProxy = (): {
  succeeds: ({
    subagentFilePath,
    parentFilePath,
  }: {
    subagentFilePath: string;
    parentFilePath: string;
  }) => void;
  getSubagentContents: ({ subagentFilePath }: { subagentFilePath: string }) => unknown;
  getParentContents: ({ parentFilePath }: { parentFilePath: string }) => unknown;
} => {
  const appendProxy = dmJsonlAppendAdapterProxy();

  return {
    succeeds: ({
      subagentFilePath,
      parentFilePath,
    }: {
      subagentFilePath: string;
      parentFilePath: string;
    }): void => {
      appendProxy.succeeds({ filePath: subagentFilePath });
      appendProxy.succeeds({ filePath: parentFilePath });
    },
    getSubagentContents: ({ subagentFilePath }: { subagentFilePath: string }): unknown =>
      appendProxy.getAppendedContents({ filePath: subagentFilePath }),
    getParentContents: ({ parentFilePath }: { parentFilePath: string }): unknown =>
      appendProxy.getAppendedContents({ filePath: parentFilePath }),
  };
};
