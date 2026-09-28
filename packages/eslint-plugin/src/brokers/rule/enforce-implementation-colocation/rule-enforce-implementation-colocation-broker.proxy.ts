import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';

/**
 * Proxy for enforce-implementation-colocation rule broker.
 * Transformers don't need proxies per folderConfigStatics (requireProxy: false).
 */
export const ruleEnforceImplementationColocationBrokerProxy = (): {
  setupFileSystem: (fileSystemCheck: (path: string) => boolean) => void;
} => {
  const existsProxy = existsSyncProxy();

  return {
    // existsSyncProxy ships no address-less catch-all: the caller's own decision function is
    // staged as two complementary predicates (matches where it says true, matches where it says
    // false), so exactly one ever answers a given call — never both, never neither.
    setupFileSystem: (fileSystemCheck: (path: string) => boolean): void => {
      existsProxy.returnsMatchingPath({
        path: (value) => fileSystemCheck(String(value)),
        exists: true,
      });
      existsProxy.returnsMatchingPath({
        path: (value) => !fileSystemCheck(String(value)),
        exists: false,
      });
    },
  };
};
