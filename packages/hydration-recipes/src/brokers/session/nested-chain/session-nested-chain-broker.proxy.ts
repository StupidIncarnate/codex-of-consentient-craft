import { appendLinesCreatingParentProxy } from '#gateway/node/fs__promises/append-lines-creating-parent/append-lines-creating-parent.proxy';
import { streamJsonLineContract } from '@dungeonmaster/shared/contracts';

import { subagentWriteRouteBrokerProxy } from '../../subagent/write-route/subagent-write-route-broker.proxy';

type StreamJsonLine = ReturnType<typeof streamJsonLineContract.parse>;

export const sessionNestedChainBrokerProxy = (): {
  succeeds: ({ filePaths }: { filePaths: readonly string[] }) => void;
  // Every line ever appended to one path, across every call this broker makes to it — a session
  // or a level-1 subagent file gets appended to more than once (a Task tool_use, then later a
  // tool_result), so `appendLinesCreatingParentProxy`'s own "last call only" read is not enough here.
  getAllAppendedLines: ({ filePath }: { filePath: string }) => readonly StreamJsonLine[];
} => {
  const appendProxy = appendLinesCreatingParentProxy();
  // Composed to satisfy the dependency this broker's own implementation declares
  // (`subagentWriteRouteBroker`); the underlying mock is shared, so staging paths
  // through `appendProxy` above already covers every write that broker makes too.
  subagentWriteRouteBrokerProxy();

  return {
    succeeds: ({ filePaths }: { filePaths: readonly string[] }): void => {
      filePaths.forEach((filePath) => {
        appendProxy.succeeds({ path: filePath });
      });
    },
    getAllAppendedLines: ({ filePath }: { filePath: string }): readonly StreamJsonLine[] =>
      appendProxy
        .getCallsFor({ path: filePath })
        .flatMap((call) =>
          String(call[1])
            .split('\n')
            .filter((line) => line.length > 0),
        )
        .map((line) => streamJsonLineContract.parse(line)),
  };
};
