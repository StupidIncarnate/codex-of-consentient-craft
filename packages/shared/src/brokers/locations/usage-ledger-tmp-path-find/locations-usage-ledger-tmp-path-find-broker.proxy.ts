import { dungeonmasterHomeFindBrokerProxy } from '../../dungeonmaster-home/find/dungeonmaster-home-find-broker.proxy';
import { pathJoinAdapterProxy } from '../../../adapters/path/join/path-join-adapter.proxy';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const locationsUsageLedgerTmpPathFindBrokerProxy = (): {
  setupLedgerTmpPath: (params: {
    homeDir: string;
    homePath: FilePath;
    ledgerTmpPath: FilePath;
  }) => void;
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
  };
};
