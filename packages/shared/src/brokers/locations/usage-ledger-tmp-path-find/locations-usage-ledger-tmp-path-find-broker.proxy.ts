import { dungeonmasterHomeFindBrokerProxy } from '../../dungeonmaster-home/find/dungeonmaster-home-find-broker.proxy';
import { pathJoinAdapterProxy } from '../../../adapters/path/join/path-join-adapter.proxy';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const locationsUsageLedgerTmpPathFindBrokerProxy = (): {
  setupLedgerTmpPath: (params: {
    homeDir: string;
    homePath: FilePath;
    ledgerTmpPath: FilePath;
  }) => void;
  setupHomeOnly: (params: { homeDir: string; homePath: FilePath }) => void;
} => {
  const dmHomeProxy = dungeonmasterHomeFindBrokerProxy();
  const pathJoinProxy = pathJoinAdapterProxy();

  return {
    setupLedgerTmpPath: ({
      homeDir,
      homePath,
      ledgerTmpPath,
    }: {
      homeDir: string;
      homePath: FilePath;
      ledgerTmpPath: FilePath;
    }): void => {
      dmHomeProxy.clearHomeEnv();
      dmHomeProxy.setupHomePath({ homeDir, homePath });
      pathJoinProxy.returns({ result: ledgerTmpPath });
    },

    // Stages the home and leaves the staging-file join REAL, so the path that comes back was
    // composed from the token the caller passed rather than replayed from a staged value. Reach for
    // this over setupLedgerTmpPath whenever the assertion is about the NAME — a staged result comes
    // back whether or not the token ever reached the filename.
    setupHomeOnly: ({ homeDir, homePath }: { homeDir: string; homePath: FilePath }): void => {
      dmHomeProxy.clearHomeEnv();
      dmHomeProxy.setupHomePath({ homeDir, homePath });
    },
  };
};
