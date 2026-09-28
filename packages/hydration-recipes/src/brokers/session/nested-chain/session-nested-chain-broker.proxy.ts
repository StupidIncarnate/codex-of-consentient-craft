import { appendFile } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { streamJsonLineContract } from '@dungeonmaster/shared/contracts';

import { dmJsonlAppendAdapterProxy } from '../../../adapters/dm-jsonl/append/dm-jsonl-append-adapter.proxy';
import { subagentWriteRouteBrokerProxy } from '../../subagent/write-route/subagent-write-route-broker.proxy';

type StreamJsonLine = ReturnType<typeof streamJsonLineContract.parse>;

export const sessionNestedChainBrokerProxy = (): {
  succeeds: ({ filePaths }: { filePaths: readonly string[] }) => void;
  // Every line ever appended to one path, across every call this broker makes to it — a session
  // or a level-1 subagent file gets appended to more than once (a Task tool_use, then later a
  // tool_result), so `dmJsonlAppendAdapterProxy`'s own "last call only" read is not enough here.
  getAllAppendedLines: ({ filePath }: { filePath: string }) => readonly StreamJsonLine[];
} => {
  const appendProxy = dmJsonlAppendAdapterProxy();
  // Composed to satisfy the dependency this broker's own implementation declares
  // (`subagentWriteRouteBroker`); the underlying `appendFile` mock is shared, so staging paths
  // through `appendProxy` above already covers every write that broker makes too.
  subagentWriteRouteBrokerProxy();
  const appendHandle = registerMock({ fn: appendFile });

  return {
    succeeds: ({ filePaths }: { filePaths: readonly string[] }): void => {
      filePaths.forEach((filePath) => {
        appendProxy.succeeds({ filePath });
      });
    },
    getAllAppendedLines: ({ filePath }: { filePath: string }): readonly StreamJsonLine[] =>
      appendHandle
        .callsMatching([filePath])
        .flatMap((call) =>
          String(call[1])
            .split('\n')
            .filter((line) => line.length > 0),
        )
        .map((line) => streamJsonLineContract.parse(line)),
  };
};
