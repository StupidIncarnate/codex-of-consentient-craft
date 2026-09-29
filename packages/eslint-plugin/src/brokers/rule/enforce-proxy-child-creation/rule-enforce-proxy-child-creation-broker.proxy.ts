// Raw registerMock on the raw Node `readFileSync`, not readFileSyncIfExistsProxy's own
// path-specific methods: readFileSyncIfExists calls the gateway's readFileSync internally, which
// mocks this SAME underlying raw fs.readFileSync, and this rule needs one predicate to answer many
// candidate paths.
import { readFileSync } from 'fs';
import { readFileSyncIfExistsProxy } from '#gateway/node/fs/read-file-sync-if-exists/read-file-sync-if-exists.proxy';
import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { FsErrorStub } from '#gateway/node/fs/is-fs-error/fs-error.stub';
import { workspaceRootFindBrokerProxy } from '../../workspace-root/find/workspace-root-find-broker.proxy';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { filePathContract } from '@dungeonmaster/shared/contracts';
import type { FileContents, FilePath } from '@dungeonmaster/shared/contracts';

export const ruleEnforceProxyChildCreationBrokerProxy = (): {
  setupFileSystem: (args: { getContents: (filePath: FilePath) => FileContents | null }) => void;
} => {
  // Satisfies enforce-proxy-child-creation for the readFileSyncIfExists import; the real staging
  // below goes through the raw handle instead, since this rule needs one predicate to answer many
  // candidate paths, which readFileSyncIfExistsProxy's exact/predicate-with-fixed-content methods
  // cannot express.
  readFileSyncIfExistsProxy();
  const readHandle = registerMock({ fn: readFileSync });
  // existsSync and workspaceRootFindBroker's own walk (below) both call the SAME gateway
  // existsSync, so staging through this one composed proxy drives every caller at once.
  const existsProxy = existsSyncProxy();
  // workspaceRootFindBroker's own fs walk shares the SAME existsSync/readFileSync mocks
  // `setupFileSystem` below wires — constructing it here only satisfies enforce-proxy-child-creation
  // (it composes no scenario of its own); every test's own `getContents` callback still governs
  // every fs probe, including the ones this broker's walk makes.
  workspaceRootFindBrokerProxy();

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

      // Same complementary-predicate split as above, addressed by the path and the fixed 'utf8'
      // encoding the gateway's readFileSync passes.
      readHandle
        .calledWith([
          (value: unknown): boolean => getContents(filePathContract.parse(String(value))) !== null,
          'utf8',
        ])
        .implement((path) => String(getContents(filePathContract.parse(String(path)))));
      readHandle
        .calledWith([
          (value: unknown): boolean => getContents(filePathContract.parse(String(value))) === null,
          'utf8',
        ])
        .implement((path) => {
          throw FsErrorStub({ code: 'ENOENT', path: String(path) });
        });
    },
  };
};
