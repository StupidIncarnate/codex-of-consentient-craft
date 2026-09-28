// Raw registerMock on the raw Node `readFileSync`, not readFileSyncIfExistsProxy's own
// path-specific methods: readFileSyncIfExists calls the gateway's readFileSync internally, which
// mocks this SAME underlying raw fs.readFileSync — this 0-arg catch-all sits BENEATH any
// path-specific staging, the sanctioned exception the a12 item's Trap section names ("a proxy that
// also offers a 0-argument setupImplementation computed per path"), matching the shape
// shared/brokers/architecture/boot-tree/read-file-contents-layer-broker.proxy.ts already uses.
import { readFileSync } from 'fs';
import { readFileSyncIfExistsProxy } from '#gateway/node/fs/read-file-sync-if-exists/read-file-sync-if-exists.proxy';
import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { FsErrorStub } from '#gateway/node/fs/is-fs-error/fs-error.stub';
import { pathDirnameAdapterProxy } from '../../../adapters/path/dirname/path-dirname-adapter.proxy';
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
  // Real passthrough default: the rule itself calls pathDirnameAdapter directly (not only through
  // workspaceRootFindBroker), so this satisfies enforce-proxy-child-creation with no staging.
  pathDirnameAdapterProxy();
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

      readHandle.calledWith([]).implement((path) => {
        const filePath = filePathContract.parse(String(path));
        const contents = getContents(filePath);
        if (contents === null) {
          throw FsErrorStub({ code: 'ENOENT', path: String(path) });
        }
        return contents;
      });
    },
  };
};
