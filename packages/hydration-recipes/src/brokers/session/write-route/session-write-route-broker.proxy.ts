import { dmJsonlAppendAdapterProxy } from '../../../adapters/dm-jsonl/append/dm-jsonl-append-adapter.proxy';
import { sessionUniqueIdResolveBrokerProxy } from '../unique-id-resolve/session-unique-id-resolve-broker.proxy';

export const sessionWriteRouteBrokerProxy = (): {
  succeeds: ({ filePath }: { filePath: string }) => void;
  getAppendedContents: ({ filePath }: { filePath: string }) => unknown;
} => {
  const appendProxy = dmJsonlAppendAdapterProxy();
  // sessionUniqueIdResolveBrokerProxy's own default (fsExistsSyncAdapterProxy's "any unaddressed
  // path is non-existent") is all this route needs for every scenario that never stages a
  // collision — the DEF-78 dedup then leaves the requested sessionId untouched.
  sessionUniqueIdResolveBrokerProxy();

  return {
    succeeds: ({ filePath }: { filePath: string }): void => {
      appendProxy.succeeds({ filePath });
    },
    getAppendedContents: ({ filePath }: { filePath: string }): unknown =>
      appendProxy.getAppendedContents({ filePath }),
  };
};
