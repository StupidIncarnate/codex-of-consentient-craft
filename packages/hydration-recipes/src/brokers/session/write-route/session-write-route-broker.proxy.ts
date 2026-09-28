import { appendLinesCreatingParentProxy } from '#gateway/node/fs__promises/append-lines-creating-parent/append-lines-creating-parent.proxy';
import { sessionUniqueIdResolveBrokerProxy } from '../unique-id-resolve/session-unique-id-resolve-broker.proxy';

export const sessionWriteRouteBrokerProxy = (): {
  succeeds: ({ filePath }: { filePath: string }) => void;
  getAppendedContents: ({ filePath }: { filePath: string }) => unknown;
} => {
  const appendProxy = appendLinesCreatingParentProxy();
  // sessionUniqueIdResolveBrokerProxy's own default (fsExistsSyncAdapterProxy's "any unaddressed
  // path is non-existent") is all this route needs for every scenario that never stages a
  // collision — the DEF-78 dedup then leaves the requested sessionId untouched.
  sessionUniqueIdResolveBrokerProxy();

  return {
    succeeds: ({ filePath }: { filePath: string }): void => {
      appendProxy.succeeds({ path: filePath });
    },
    getAppendedContents: ({ filePath }: { filePath: string }): unknown =>
      appendProxy.appendedContentsFor({ path: filePath }),
  };
};
