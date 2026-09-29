import { readFileSyncIfExistsProxy } from '#gateway/node/fs/read-file-sync-if-exists/read-file-sync-if-exists.proxy';
import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { barrelWrapperPathsReadBrokerProxy } from '../../barrel-wrapper-paths/read/barrel-wrapper-paths-read-broker.proxy';
import { workspaceRootFindBrokerProxy } from '../../workspace-root/find/workspace-root-find-broker.proxy';
import { filePathContract } from '@dungeonmaster/shared/contracts';
import type { FileContents, FilePath } from '@dungeonmaster/shared/contracts';

export const ruleEnforceProxyChildCreationBrokerProxy = (): {
  setupFileSystem: (args: { getContents: (filePath: FilePath) => FileContents | null }) => void;
} => {
  // One predicate answers many candidate paths, so the read side stages through
  // implementsMatchingPath, whose `null` is the wrapper's own ENOENT.
  const readProxy = readFileSyncIfExistsProxy();
  // existsSync and workspaceRootFindBroker's own walk (below) both call the SAME gateway
  // existsSync, so staging through this one composed proxy drives every caller at once.
  const existsProxy = existsSyncProxy();
  // workspaceRootFindBroker's own fs walk shares the SAME existsSync/readFileSync mocks
  // `setupFileSystem` below wires — constructing it here only satisfies enforce-proxy-child-creation
  // (it composes no scenario of its own); every test's own `getContents` callback still governs
  // every fs probe, including the ones this broker's walk makes.
  workspaceRootFindBrokerProxy();
  // The barrel reads go through the same gateway readFileSyncIfExists staged by setupFileSystem, so
  // composing this proxy only satisfies enforce-proxy-child-creation.
  barrelWrapperPathsReadBrokerProxy();

  return {
    setupFileSystem: ({
      getContents,
    }: {
      getContents: (filePath: FilePath) => FileContents | null;
    }): void => {
      // existsSyncProxy ships no address-less catch-all: the caller's own getContents decision is
      // staged as two complementary predicates, so exactly one ever answers a given call.
      existsProxy.returnsMatchingPath({
        path: (value) => getContents(filePathContract.parse(String(value))) !== null,
        exists: true,
      });
      existsProxy.returnsMatchingPath({
        path: (value) => getContents(filePathContract.parse(String(value))) === null,
        exists: false,
      });

      // Opt-in virtual file tree (concession 10): addressed by the path alone, so any string
      // reaches the caller's own getContents.
      readProxy.implementsMatchingPath({
        path: (value) => typeof value === 'string',
        fn: (path) => getContents(filePathContract.parse(path)),
      });
    },
  };
};
