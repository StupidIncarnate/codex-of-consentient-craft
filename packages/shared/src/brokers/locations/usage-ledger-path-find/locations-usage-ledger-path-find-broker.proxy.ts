import { dungeonmasterHomeFindBrokerProxy } from '../../dungeonmaster-home/find/dungeonmaster-home-find-broker.proxy';
import { pathJoinAdapterProxy } from '../../../adapters/path/join/path-join-adapter.proxy';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const locationsUsageLedgerPathFindBrokerProxy = (): {
  setupLedgerPath: (params: { homeDir: string; homePath: FilePath; ledgerPath: FilePath }) => void;
} => {
  const dmHomeProxy = dungeonmasterHomeFindBrokerProxy();
  const pathJoinProxy = pathJoinAdapterProxy();

  return {
    setupLedgerPath: ({
      homeDir,
      homePath,
      ledgerPath,
    }: {
      homeDir: string;
      homePath: FilePath;
      ledgerPath: FilePath;
    }): void => {
      dmHomeProxy.clearHomeEnv();
      dmHomeProxy.setupHomePath({ homeDir, homePath });
      pathJoinProxy.returns({ result: ledgerPath });
    },
  };
};
