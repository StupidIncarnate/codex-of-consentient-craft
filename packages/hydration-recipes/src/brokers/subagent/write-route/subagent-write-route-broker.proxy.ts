import { appendLinesCreatingParentProxy } from '#gateway/node/fs__promises/append-lines-creating-parent/append-lines-creating-parent.proxy';

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
  const appendProxy = appendLinesCreatingParentProxy();

  return {
    succeeds: ({
      subagentFilePath,
      parentFilePath,
    }: {
      subagentFilePath: string;
      parentFilePath: string;
    }): void => {
      appendProxy.succeeds({ path: subagentFilePath });
      appendProxy.succeeds({ path: parentFilePath });
    },
    getSubagentContents: ({ subagentFilePath }: { subagentFilePath: string }): unknown =>
      appendProxy.appendedContentsFor({ path: subagentFilePath }),
    getParentContents: ({ parentFilePath }: { parentFilePath: string }): unknown =>
      appendProxy.appendedContentsFor({ path: parentFilePath }),
  };
};
